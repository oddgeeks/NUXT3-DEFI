<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { storeToRefs } from 'pinia'
import { utils } from 'ethers'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg'
import type { IToken } from '~~/stores/tokens'
import { Erc20__factory } from '~~/contracts'
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg'
import ArrowLeft from '~/assets/images/icons/arrow-left.svg'
import QuestionCircleSVG from '~/assets/images/icons/question-circle.svg'

interface ISwap {
  sellToken: IToken
  buyToken: IToken
}

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
  toAddress: {
    type: String,
  },
  chainId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['destroy'])

const abortController = ref<AbortController | null>(null)

const { tokenBalances, sendTransactions, safeAddress } = useAvocadoSafe()

const { getTokenByAddress } = useTokens()
const { tokens } = storeToRefs(useTokens())
const { toWei, fromWei } = useBignumber()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()

const toChainId = ref<string>(props.chainId)
const tokenAddress = ref<string>(props.address)
const networks = availableNetworks.filter(
  network => network.chainId !== 1101,
)

const slippages = [
  { value: '0.1', label: '0.1%' },
  { value: '0.3', label: '0.3%' },
  { value: '0.5', label: '0.5%' },
  { value: '1', label: '1%' },
  { value: '2', label: '2%' },
  { value: '3', label: '3%' },
]

const slippage = useLocalStorage('slippage', '0.3')
const customSlippage = useLocalStorage('customSlippage', '')

function defaultSwapDetails() {
  return {
    data: null as ISwapResponse | null,
    error: '',
    pending: false,
  }
}

const swapDetails = ref(defaultSwapDetails())
const [swapped, toggleSwapped] = useToggle()
const [isBuyAmountDirty, toggleDirty] = useToggle(false)
const refreshing = ref(false)

const swap = ref<ISwap>({
  sellToken: getTokenByAddress(tokenAddress.value, toChainId.value)!,
  buyToken: getTokenByAddress(tokenAddress.value, toChainId.value)!,
})

const availableTokens = computed(() =>
  tokens.value.filter(
    t =>
      t.chainId == toChainId.value && t.address !== swap.value.buyToken.address,
  ),
)

const availableBuyTokens = computed(() =>
  availableTokens.value.filter(
    t => t.address !== swap.value.sellToken.address,
  ),
)

watch(toChainId, () => {
  swap.value.buyToken = availableBuyTokens.value[0]
  swap.value.sellToken = availableTokens.value[0]

  swapDetails.value = defaultSwapDetails()
})

const sellTokenBalance = computed(
  () =>
    tokenBalances.value.find(
      t =>
        t.address == swap.value.sellToken.address
        && t.chainId == toChainId.value,
    )?.balance || '0.00',
)

const buyTokenBalance = computed(
  () =>
    tokenBalances.value.find(
      t =>
        t.address == swap.value.buyToken.address && t.chainId == toChainId.value,
    )?.balance || '0.00',
)

function validateMinAmount(value: any) {
  const amount = toBN(value)

  return value ? amount.gt(0) : true
}

function validateMaxAmount(value: any, balance: string) {
  const amount = toBN(value)

  return amount.gt(0) ? amount.lte(toBN(balance)) : true
}

const { handleSubmit, errors, meta, validate, isSubmitting, resetForm }
  = useForm({
    initialValues: {
      'sell-amount': undefined,
      'buy-amount': undefined,
    },
    validationSchema: yup.object({
      'sell-amount': yup
        .string()
        .required('')
        .test('min-amount', '', validateMinAmount)
        .test('max-amount', 'Insufficient balance', (val: any) =>
          validateMaxAmount(val, sellTokenBalance.value),
        ),
    }),
  })

const buyAmount = ref()
const {
  value: sellAmount,
  meta: sellAmountMeta,
  setState: setSellAmount,
} = useField<string>('sell-amount')

const actualSlippage = computed(() => customSlippage.value || slippage.value)

const slippageError = computed(() => {
  const message = 'Slippage must be between 0.0001% and 100%'
  const value = toBN(actualSlippage.value)
  if (actualSlippage.value)
    return value.gte(0.0001) && value.lte(100) ? '' : message
  else return ''
})

function convertBuytoSellAmount(val: string) {
  const sellTokenPrice = swap.value.sellToken.price
  const buyTokenPrice = swap.value.buyToken.price

  if (!sellTokenPrice || !buyTokenPrice)
    return

  const buyAmountInSellAmount = toBN(val)
    .div(toBN(sellTokenPrice))
    .times(toBN(buyTokenPrice))
    .decimalPlaces(4)
    .toFixed()

  setSellAmount({
    touched: true,
    value: buyAmountInSellAmount,
  })
}

function handleBuyAmountInput(e: any) {
  const val = e.target.value
  if (val)
    convertBuytoSellAmount(val)

  toggleDirty(true)
}

function setMax() {
  toggleDirty(false)
  sellAmount.value = toBN(sellTokenBalance.value)
    .decimalPlaces(6, 1)
    .toString()
}

function handleSellAmountInput() {
  toggleDirty(false)
}

const sendingDisabled = computed(
  () =>
    isSubmitting.value
    || swapDetails.value.pending
    || !meta.value.valid
    || feePending.value
    || isPriceImpactHigh.value
    || !!swapDetails.value.error
    || !!error.value
    || !!slippageError.value,
)

const isLoading = computed(
  () => swapDetails.value.pending && meta.value.valid && !refreshing.value,
)
async function fetchSwapDetails() {
  const { valid } = await validate()
  if (!valid || !!slippageError.value)
    return

  pause()

  try {
    if (abortController.value)
      abortController.value.abort()

    abortController.value = new AbortController()

    swapDetails.value.pending = true

    const data: ISwapResponse = await http(
      'https://swap-aggregator.instadapp.io/swap',
      {
        signal: abortController.value?.signal,
        params: {
          network: getNetworkByChainId(toChainId.value).name.toLowerCase(),
          buyToken: swap.value.buyToken.address,
          sellToken: swap.value.sellToken.address,
          sellAmount: toWei(sellAmount.value, swap.value.sellToken.decimals),
          maxSlippage: actualSlippage.value,
          slippage: actualSlippage.value,
          user: safeAddress.value,
          access_token: 'hxBA1uxwaGWN0xcpPOncVJ3Tk7FdFxY7g3NX28R14C',
        },
      },
    )
    abortController.value = null

    const best = data?.aggregators[0]

    if (!best) {
      swapDetails.value.error = 'No route found, please try again later'
      return
    }

    if (best && !isBuyAmountDirty.value) {
      buyAmount.value = formatDecimal(
        fromWei(
          best.data.buyTokenAmount,
          best.data.buyToken.decimals,
        ).toFixed(),
        6,
      )
    }

    swapDetails.value.data = data
    swapDetails.value.pending = false
    swapDetails.value.error = ''
  }
  catch (e: any) {
    const err = parseTransactionError(e)
    if (err.parsed?.includes('aborted'))
      return
    swapDetails.value.pending = false
    swapDetails.value.error = 'No route found, please try again later.'
  }
}

const bestRoute = computed(
  () => swapDetails.value?.data?.aggregators[0] || null,
)

const priceImpact = computed(() =>
  toBN(bestRoute?.value?.data?.priceImpact || 0)
    .abs()
    .toFixed(),
)

const isPriceImpactHigh = computed(() => {
  if (!bestRoute.value)
    return false

  return toBN(priceImpact.value).gt(actualSlippage.value)
})

const sellAmountInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data?.data.sellTokenAmount || 0,
      swapDetails.value?.data?.data.sellToken.decimals,
    ),
  )
    .times(swapDetails.value?.data?.data.sellToken.price || 0)
    .toFixed(2)
})

const buyAmountInUsd = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data?.data.buyTokenAmount || 0,
      swapDetails.value?.data?.data.buyToken.decimals,
    ),
  )
    .times(swapDetails.value?.data?.data.buyToken.price || 0)
    .toFixed(2)
})

const minRecievedAfterSlippage = computed(() => {
  return formatDecimal(fromWei(
    swapDetails.value?.data?.data.buyTokenAmount || 0,
    swap.value.buyToken.decimals,
  )
    .div(toBN(1).plus(toBN(actualSlippage.value).div(100))).toFixed())
})

const buyTokenAmountPerSellToken = computed(() => {
  const value = div(buyAmount.value, sellAmount.value)

  return value.isFinite() ? formatDecimal(value.toFixed()) : '0.00'
})

const sellTokenAmountPerBuyToken = computed(() => {
  const value = div(sellAmount.value, buyAmount.value)

  return value.isFinite() ? formatDecimal(value.toFixed()) : '0.00'
})

function swapTokens() {
  const sellTemp = swap.value.sellToken
  const buyTemp = swap.value.buyToken

  swap.value.buyToken = sellTemp
  swap.value.sellToken = buyTemp
  toggleSwapped()
}

const { data: txs } = useAsyncData(
  async () => {
    const { valid } = await validate()

    if (!valid)
      return
    if (!bestRoute.value)
      throw new Error('Route not found')

    pause()

    const address = bestRoute.value?.data.to

    const erc20 = Erc20__factory.connect(
      address,
      getRpcProvider(toChainId.value),
    )

    const txs = []

    if (
      swap.value.sellToken.address
      !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    ) {
      const { data } = await erc20.populateTransaction.approve(
        bestRoute.value.data.allowanceSpender || address,
        bestRoute.value.data.sellTokenAmount,
      )

      txs.push({
        to: swap.value.sellToken.address,
        data,
      })
    }

    txs.push({
      to: address,
      data: bestRoute.value?.data.calldata,
      value: bestRoute.value?.data.value,
    })
    return txs
  },
  {
    watch: [bestRoute],
    server: false,
  },
)

const {
  data,
  pending: feePending,
  error,
} = useEstimatedFee(txs, toChainId, {
  cb: () => {
    resume()
    refreshing.value = false
  },
})

const onSubmit = handleSubmit(async () => {
  try {
    pause()
    const metadata = encodeSwapMetadata({
      buyAmount: swapDetails.value?.data?.data.buyTokenAmount!,
      sellAmount: swapDetails.value?.data?.data.sellTokenAmount!,
      buyToken: swapDetails.value?.data?.data.buyToken.address!,
      sellToken: swap.value.sellToken.address,
      receiver: account.value,
      protocol: utils.formatBytes32String(bestRoute?.value?.name || ''),
    })

    const transactionHash = await sendTransactions(
      txs.value!,
      +toChainId.value,
      {
        metadata,
      },
    )

    if (!transactionHash) {
      // tracking mode
      return
    }

    const buyAmt = fromWei(
      swapDetails.value?.data?.data.buyTokenAmount || 0,
      swapDetails.value?.data?.data.buyToken.decimals,
    ).toFixed()

    const sellAmt = fromWei(
      swapDetails.value?.data?.data.sellTokenAmount || 0,
      swapDetails.value?.data?.data.sellToken.decimals,
    ).toFixed()

    logActionToSlack({
      message: `${formatDecimal(sellAmt)} ${formatSymbol(
        swap.value.sellToken.symbol,
      )} to ${formatDecimal(buyAmt)} ${formatSymbol(
        swap.value.buyToken.symbol,
      )}`,
      action: 'swap',
      account: account.value,
      chainId: toChainId.value,
      txHash: transactionHash,
    })

    resetForm()
    emit('destroy')

    showPendingTransactionModal(transactionHash, toChainId.value, 'swap')
  }
  catch (e: any) {
    const err = parseTransactionError(e)
    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      type: 'error',
      action: 'swap',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
  finally {
    resume()
  }
})

const { pause, resume } = useInterval(10000, {
  controls: true,
  callback: () => {
    refreshing.value = true
    fetchSwapDetails()
  },
})

onMounted(() => {
  // set initial buy token
  const eth = availableBuyTokens.value.find(i => i.symbol.includes('eth'))
  const usdc = availableBuyTokens.value.find(i => i.symbol === 'usdc')

  const isEth = swap.value.sellToken.symbol.includes('eth')

  swap.value.buyToken = getTokenByAddress(
    props.toAddress
      || (isEth ? usdc?.address : eth?.address)
      || availableBuyTokens.value[0].address,
    toChainId.value,
  )!

  if (props.amount) {
    setSellAmount({
      value: props.amount,
      touched: true,
    })
  }
})

watch([() => swap.value.sellToken, () => swap.value.buyToken], () => {
  toggleSwapped()
})

watch(sellAmount, () => {
  if (!sellAmount.value)
    buyAmount.value = ''
})

watch(slippage, () => {
  customSlippage.value = ''
})

watch([sellAmount, swapped, actualSlippage, toChainId], () => {
  fetchSwapDetails()
})

onUnmounted(() => {
  abortController.value?.abort()
})
</script>

<template>
  <form novalidate class="flex gap-7.5 flex-col" @submit="onSubmit">
    <div class="flex flex-col items-center justify-center">
      <div class="flex flex-col gap-[15px] w-full">
        <h2 class="text-lg leading-5 text-center">
          Swap
        </h2>
        <div
          class="flex items-center justify-center w-2/5 mx-auto rounded-full"
        >
          <CommonSelect
            v-model="toChainId"
            value-key="chainId"
            label-key="name"
            icon-key="icon"
            :options="networks"
            class="w-full rounded-full"
          >
            <template #button-prefix>
              <ChainLogo class="w-6 h-6" :chain="toChainId" />
            </template>
            <template #item-prefix="{ value }">
              <ChainLogo class="w-6 h-6" :chain="value" />
            </template>
          </CommonSelect>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div
        class="relative flex flex-col gap-4 px-5 py-4 border-2 border-transparent dark:bg-slate-800 bg-slate-100 focus-within:bg-slate-50 focus-within:dark:border-slate-800 focus-within:border-slate-150 focus-within:dark:bg-gray-850 rounded-5"
      >
        <div class="flex">
          <CommonInput
            v-model="sellAmount"
            autofocus
            transparent
            placeholder="0.0"
            name="sell-amount"
            type="numeric"
            class="flex-1"
            input-classes="text-[26px] placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
            container-classes="!px-0"
            @input="handleSellAmountInput"
          />
          <TokenSelection
            v-model="swap.sellToken"
            :tokens="availableTokens"
            class="dark:bg-gray-900 bg-white"
          />
        </div>
        <div class="flex items-center justify-between text-sm text-slate-400">
          <div
            v-if="isLoading"
            style="width: 60px; height: 20px"
            class="rounded-lg loading-box"
          />
          <span v-else>{{ formatUsd(sellAmountInUsd) }}</span>
          <div class="flex items-center ml-auto gap-2.5 uppercase">
            <span class="font-medium">{{ formatDecimal(sellTokenBalance) }}
              {{ swap.sellToken?.symbol }}</span>
            <button type="button" class="text-primary" @click="setMax">
              MAX
            </button>
          </div>
        </div>
        <span
          v-if="sellAmountMeta.dirty && errors['sell-amount']"
          class="flex items-center gap-2 mt-2 text-xs text-left text-red-alert"
        >
          <SVGInfo /> {{ errors["sell-amount"] }}
        </span>
        <button
          type="button"
          class="flex justify-center items-center absolute bg-slate-150 dark:bg-slate-600 ring-[6px] ring-white dark:ring-gray-950 rounded-full h-10 w-10 -bottom-[26px] left-1/2 -translate-x-1/2"
          @click="swapTokens"
        >
          <ArrowLeft class="w-5 h-5 -rotate-90 text-slate-400" />
        </button>
      </div>

      <div
        class="flex flex-col gap-4 px-5 py-4 border-2 border-transparent dark:bg-slate-800 bg-slate-100 focus-within:bg-slate-50 focus-within:dark:border-slate-800 focus-within:border-slate-150 focus-within:dark:bg-gray-850 rounded-5"
      >
        <div class="flex">
          <div class="flex items-center flex-1">
            <div
              v-if="isLoading"
              style="width: 100px; height: 28px"
              class="rounded-lg loading-box"
            />
            <CommonInput
              v-else
              v-model="buyAmount"
              transparent
              type="numeric"
              placeholder="0.0"
              name="buy-amount"
              class="flex-1"
              input-classes="text-[26px] placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
              container-classes="!px-0"
              @input="handleBuyAmountInput"
            />
          </div>
          <TokenSelection
            v-model="swap.buyToken"
            :tokens="availableBuyTokens"
            class="dark:bg-gray-900 bg-white"
          />
        </div>
        <div class="flex items-center justify-between text-sm text-slate-400">
          <div
            v-if="isLoading"
            style="width: 60px; height: 20px"
            class="rounded-lg loading-box"
          />
          <span v-else>{{ formatUsd(buyAmountInUsd) }}</span>
          <div class="flex items-center ml-auto gap-2.5 uppercase">
            <span class="font-medium">{{ formatDecimal(buyTokenBalance) }}
              {{ swap.buyToken?.symbol }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <div class="px-5 pt-[14px] pb-5 dark:bg-gray-850 bg-slate-50 rounded-5">
          <div class="flex flex-col gap-5">
            <details open class="flex flex-col group">
              <summary
                class="flex justify-between text-sm font-semibold cursor-pointer"
              >
                <span class="inline-flex gap-2.5">
                  Slippage

                  <button
                    v-tippy="
                      'Slippage is the difference between the expected price of an order and the price when the order actually executes. The slippage tolerance % lets you decide how much slippage you are willing to accept for a trade.'
                    "
                    type="button"
                  >
                    <QuestionCircleSVG class="w-5 h-5 text-primary" />
                  </button>
                </span>
                <ChevronDownSVG
                  class="w-5 text-slate-400 group-open:rotate-180"
                />
              </summary>
              <div class="flex items-end flex-1 gap-4 mt-4">
                <div class="flex flex-col gap-2.5 flex-1">
                  <CommonSelect
                    v-model="slippage"
                    value-key="value"
                    label-key="label"
                    :container-classes="
                      !customSlippage ? '!border-primary' : ''
                    "
                    :options="slippages"
                  >
                    <template #button-prefix>
                      <div
                        :class="{ '!border-primary': !customSlippage }"
                        class="radio !mr-0"
                      />
                    </template>
                  </CommonSelect>
                </div>
                <CommonInput
                  v-model="customSlippage"
                  name="slippage"
                  type="numeric"
                  placeholder="Custom"
                  input-classes="!py-3"
                  class="flex-1"
                  :container-classes="customSlippage ? '!ring-primary' : ''"
                >
                  <template #prefix>
                    <div
                      :class="{ '!border-primary': customSlippage }"
                      class="radio"
                    />
                  </template>
                </CommonInput>
              </div>
              <span
                v-if="!!slippageError"
                class="flex items-center gap-2 mt-4 text-xs text-left text-red-alert"
              >
                <SVGInfo />
                {{ slippageError }}
              </span>
            </details>

            <div class="ticket-divider" />

            <div class="flex flex-col gap-4">
              <div
                class="flex flex-col items-center justify-between text-sm font-medium uppercase sm:flex-row text-slate-400"
              >
                <div
                  v-if="isLoading"
                  style="width: 140px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <div
                  v-else
                  class="flex items-center justify-between w-full sm:justify-start sm:gap-2"
                >
                  <span>1 {{ swap.sellToken?.symbol }}</span>
                  <span class="hidden sm:block"> = </span>
                  <span>{{ buyTokenAmountPerSellToken }}
                    {{ swap.buyToken?.symbol }}</span>
                </div>
                <div
                  v-if="isLoading"
                  style="width: 140px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <div
                  v-else
                  class="flex items-center justify-between w-full sm:justify-end sm:gap-2"
                >
                  <span>1 {{ swap.buyToken?.symbol }}</span>
                  <span class="hidden sm:block"> = </span>
                  <span>{{ sellTokenAmountPerBuyToken }}
                    {{ swap.sellToken?.symbol }}</span>
                </div>
              </div>
              <div
                class="items-center justify-between hidden text-sm font-medium sm:flex text-slate-400"
              >
                <span>
                  Minimum Received after slippage ({{ actualSlippage }}%)
                </span>
                <div
                  v-if="isLoading"
                  style="width: 140px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <span v-else class="uppercase">
                  {{ minRecievedAfterSlippage }}
                  {{ swap.buyToken.symbol }}
                </span>
              </div>
              <div
                class="flex items-center justify-between text-sm font-medium"
              >
                <span :class="{ '!text-red-alert': gt(priceImpact, 0.04) }">Price Impact</span>
                <div
                  v-if="isLoading"
                  style="width: 100px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <span
                  v-else
                  :class="{ '!text-red-alert': gt(priceImpact, 0.04) }"
                >
                  {{ formatPercent(priceImpact) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EstimatedFee
        :chain-id="toChainId"
        :loading="feePending"
        :data="data"
        :error="error"
      />
      <CommonNotification
        v-if="swapDetails.error"
        type="error"
        :text="swapDetails.error"
      />
      <CommonNotification
        v-if="isPriceImpactHigh"
        type="warning"
        text="Slippage value should be greater than price impact.  "
      />
    </div>

    <div class="flex flex-col gap-4">
      <CommonButton
        type="submit"
        :disabled="sendingDisabled"
        :loading="isSubmitting || swapDetails.pending || feePending"
        class="justify-center w-full"
        size="lg"
      >
        Swap
      </CommonButton>
    </div>
  </form>
</template>

<style scoped>
.radio {
  @apply w-5 h-5 rounded-full border-[6.5px] dark:border-slate-600 mr-3 border-slate-300 shrink-0;
}
</style>
