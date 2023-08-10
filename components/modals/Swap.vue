<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'
import { storeToRefs } from 'pinia'
import { utils } from 'ethers'
import type { IBalance } from '~/stores/safe'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'
import type { IToken } from '~~/stores/tokens'
import { Erc20__factory } from '~~/contracts'
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'
import ArrowLeft from '~/assets/images/icons/arrow-left.svg?component'
import QuestionCircleSVG from '~/assets/images/icons/question-circle.svg?component'

interface ISwap {
  sellToken: IToken
  buyToken: IToken | IBalance
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
const { authorisedNetworks } = useAuthorities()

const toChainId = ref<string>(props.chainId)
const tokenAddress = ref<string>(props.address)
const networks = computed(() => authorisedNetworks.value?.filter(
  network => network.chainId !== 1101,
))

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
const inputUSDToggle = useLocalStorage('inputUsdToggle', false)

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
const sellInputWrapperRef = ref<HTMLDivElement>()

const refreshing = ref(false)

const isUsdBuyAmountFocused = ref(false)
const isSellAmountFocused = ref(false)

const swap = ref<ISwap>({
  sellToken: getTokenByAddress(tokenAddress.value, toChainId.value)!,
  buyToken: getTokenByAddress(tokenAddress.value, toChainId.value)!,
})

const availableTokens = computed(() =>
  tokens.value.filter(
    t =>
      t.address !== swap.value.buyToken.address,
  ),
)

const availableBuyTokens = computed(() =>
  tokens.value.filter(
    t => t.chainId == swap.value.sellToken.chainId && t.address !== swap.value.sellToken.address,
  ),
)

watch([() => swap.value.sellToken], () => {
  if (swap.value.sellToken.chainId != toChainId.value) {
    swap.value.buyToken = availableBuyTokens.value[0]
    // swap.value.sellToken = availableTokens.value[0]
    toChainId.value = swap.value.sellToken.chainId

    swapDetails.value = defaultSwapDetails()
  }
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

    const name = getNetworkByChainId(toChainId.value).name

    const actualName
    = name === 'Ethereum' ? 'mainnet' : name.toLocaleLowerCase()

    const data: ISwapResponse = await http('/swap',
      {
        baseURL: swapAggregatorURL,
        signal: abortController.value?.signal,
        params: {
          network: actualName,
          buyToken: swap.value.buyToken.address,
          sellToken: swap.value.sellToken.address,
          sellAmount: toWei(sellAmount.value, swap.value.sellToken.decimals),
          maxSlippage: actualSlippage.value,
          slippage: actualSlippage.value,
          user: safeAddress.value,
          access_token: swapAggregatorAccessToken,
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
      buyAmount.value = fromWei(
        best.data.buyTokenAmount,
        best.data.buyToken.decimals,
      ).decimalPlaces(6, 1)
        .toString()
    }

    bestRoute.value = best
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

const bestRoute = ref<IAggregator>()

const priceImpact = computed(() =>
  toBN(bestRoute?.value?.data?.priceImpact || 0)
    .abs()
    .toFixed(),
)

const sellTokenAmount = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data?.data.sellTokenAmount || 0,
      swapDetails.value?.data?.data.sellToken.decimals,
    ),
  ).toNumber()
})

const buyTokenAmount = computed(() => {
  return toBN(
    fromWei(
      swapDetails.value?.data?.data.buyTokenAmount || 0,
      swapDetails.value?.data?.data.buyToken.decimals,
    ),
  ).toNumber()
})

const sellAmountInUsd = computed(() => {
  return toBN(sellTokenAmount.value)
    .times(swapDetails.value?.data?.data.sellToken.price || 0)
    .toFixed(2)
})

const buyAmountInUsd = computed(() => {
  return toBN(buyTokenAmount.value)
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

function handleUsdChange(e: Event) {
  const target = e.target as HTMLInputElement
  const actualValue = target?.value ? target.value.replace('$', '') : '0'

  if (target?.value === '$') {
    target.value = '0'
    return setSellAmount({
      value: '0',
      touched: true,
    })
  }

  if (actualValue) {
    const value = toBN(actualValue).div(swap.value.sellToken.price || 0)

    setSellAmount({
      value: toBN(value)
        .decimalPlaces(6, 1)
        .toString(),
      touched: true,
    })
  }
}

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

    if (!transactionHash)
      return

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
      amountInUsd: sellAmountInUsd.value,
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

function focusInput() {
  if (!sellInputWrapperRef.value)
    return

  const inputEl = sellInputWrapperRef.value.querySelector('input')

  if (!inputEl)
    return

  inputEl.focus()
}

watch(inputUSDToggle, async () => {
  await nextTick()
  focusInput()
}, {
  immediate: true,
})

const { pause, resume } = useInterval(10000, {
  controls: true,
  callback: () => {
    if (bestRoute.value?.name !== swapDetails.value.data?.aggregators[0]?.name)
      return

    refreshing.value = true
    fetchSwapDetails()
  },
})

function setAnotherRoute() {
  const route = swapDetails.value.data?.aggregators?.find(i => i.name !== bestRoute.value?.name)

  if (route)
    bestRoute.value = route
}

function lc(s: string) {
  return s.toLocaleLowerCase()
}

onMounted(() => {
  // set initial buy token
  const selltokenSymbol = lc(swap.value.sellToken.symbol)
  const usdc = availableBuyTokens.value.find(i => lc(i.symbol) === 'usdc')!
  const usdt = availableBuyTokens.value.find(i => lc(i.symbol) === 'usdt')!
  const usdbc = availableBuyTokens.value.find(i => lc(i.symbol) === 'usdbc')!

  const defaultAlternative = 'eth'

  const tokenAlternatives = {
    eth: 'usdc',
    weth: 'eth',
    usdc: 'eth',
    usdt: 'eth',
    dai: 'eth',
    usdbc: 'eth',
  } as Record<string, string>

  const alternativeTokenSymbol = tokenAlternatives[selltokenSymbol] || defaultAlternative

  const alternativeToken = availableBuyTokens.value.find(i => lc(i.symbol) === alternativeTokenSymbol)
  const fallback = availableBuyTokens.value[0]

  const token = alternativeToken || usdt || usdc || usdbc || fallback

  if (token)
    swap.value.buyToken = token

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
        <div class="flex gap-[14px]">
          <div class="w-10 h-10 rounded-full items-center flex justify-center bg-primary">
            <SvgoRefresh class="-rotate-45" />
          </div>
          <div class="flex flex-col gap-1">
            <h1 class="text-lg leading-[20px]">
              Swap
            </h1>
            <h2 class="font-medium text-xs text-slate-400 leading-5">
              Trade tokens on multiple networks at best price.
            </h2>
          </div>
        </div>
        <div
          class="flex gap-2 justify-between items-center mt-5 w-full mx-auto rounded-full"
        >
          <p class="text-xs py-1 px-5 rounded-full border border-[#1e293b]">
            <span class="sm:inline hidden"> Processing on the</span> <ChainLogo class="w-6 h-6 inline" :chain="toChainId" /> {{ networks.find(network => network.chainId === parseInt(toChainId))?.name }} Network
          </p>
          <CommonToggle v-model="inputUSDToggle" text="Input USD" />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <div
        class="relative flex flex-col gap-4 px-5 py-4 border-2 border-transparent dark:bg-slate-800 bg-slate-100 focus-within:bg-slate-50 focus-within:dark:border-slate-800 focus-within:border-slate-150 focus-within:dark:bg-gray-850 rounded-5"
      >
        <div class="flex">
          <div
            v-if="isLoading && !isSellAmountFocused"
            class="flex-1 flex items-center"
          >
            <div
              style="width: 100px; height: 28px"
              class="rounded-lg loading-box"
            />
          </div>
          <div v-else ref="sellInputWrapperRef" class="flex-1">
            <CommonInput
              v-if="!inputUSDToggle"
              v-model="sellAmount"
              transparent
              placeholder="0.0"
              name="sell-amount"
              type="numeric"
              class="flex-1"
              input-classes="text-[26px] placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
              container-classes="!px-0"
              @input-focus="isSellAmountFocused = true"
              @input-blur="isSellAmountFocused = false"
              @input="handleSellAmountInput"
            />
            <CommonCurrencyInput
              v-else
              class="flex-1 text-[26px] w-full placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
              :model-value="toBN(sellAmountInUsd).toNumber()"
              @focus="isSellAmountFocused = true"
              @blur="isSellAmountFocused = false"
              @input="handleUsdChange"
            />
          </div>
          <TokenSelection
            v-model="swap.sellToken"
            :tokens="availableTokens"
            class="dark:bg-gray-900 bg-white"
          />
        </div>
        <div class="flex items-center justify-between text-sm text-slate-400">
          <div
            v-if="isLoading"
            style="width: 60px; height: 24px"
            class="rounded-lg loading-box"
          />
          <p
            v-else
            class="font-medium leading-6"
          >
            {{ !inputUSDToggle ? `${formatUsd(toBN(sellAmountInUsd).toNumber())}` : `${sellAmount ? sellAmount : 0}` }}
          </p>
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
          <div
            v-if="isLoading && !isUsdBuyAmountFocused"
            class="flex-1 flex items-center"
          >
            <div
              style="width: 100px; height: 28px"
              class="rounded-lg loading-box"
            />
          </div>
          <div v-else class="flex-1">
            <CommonInput
              v-if="!inputUSDToggle"
              v-model="buyAmount"
              transparent
              placeholder="0.0"
              name="buy-amount"
              type="numeric"
              class="flex-1"
              input-classes="text-[26px] placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
              container-classes="!px-0"
              @input-focus="isUsdBuyAmountFocused = true"
              @input-blur="isUsdBuyAmountFocused = false"
              @input="handleBuyAmountInput"
            />
            <CommonCurrencyInput
              v-else
              class="flex-1 text-[26px] w-full placeholder:!text-[26px] !p-0 leading-[48px] rounded-none"
              :model-value="toBN(buyAmountInUsd).toNumber()"
              @focus="isUsdBuyAmountFocused = true"
              @blur="isUsdBuyAmountFocused = false"
              @input="handleUsdChange"
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
            style="width: 60px; height: 24px"
            class="rounded-lg loading-box"
          />
          <p
            v-else
            class="font-medium leading-6"
          >
            {{ !inputUSDToggle ? `${formatUsd(toBN(buyAmountInUsd).toNumber())}` : `${buyAmount ? buyAmount : 0}` }}
          </p>

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
                  Route Through
                </span>
                <div
                  v-if="isLoading"
                  style="width: 140px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <span
                  v-else-if="!!bestRoute && swapDetails.data?.aggregators?.length"
                  class="capitalize hidden sm:flex items-center gap-2.5"
                >
                  <Menu v-slot="{ open }" as="div" class="relative">
                    <MenuButton class="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-slate-150 dark:border-slate-750">
                      <ProtocolLogo class="w-5 h-5" :name="bestRoute.name" />
                      {{ formatProtocol(bestRoute.name) }}
                      <SvgoChevronDown class="w-4" :class="open ? 'rotate-180' : ''" />
                    </MenuButton>
                    <transition
                      enter-active-class="transition duration-100 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-75 ease-out"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <MenuItems
                        class="absolute rounded-5 z-20 py-4 top-12 left-1/2 -translate-x-1/2 w-[300px] origin-center dark:bg-gray-850 border-slate-150 border bg-slate-50 dark:border-slate-700"
                      >
                        <template v-for="aggr, i in swapDetails.data?.aggregators" :key="aggr.name">
                          <MenuItem as="button" type="button" class="font-medium w-full text-left px-4 py-[14px] first:pt-0 last-of-type:pb-0" @click="bestRoute = aggr">
                            <div class="flex gap-2">
                              <ProtocolLogo class="w-5 h-5" :name="aggr.name" />
                              <div class="flex flex-col gap-1 w-full">
                                <div class="flex justify-between w-full">
                                  <span class="text-white">
                                    {{ formatProtocol(aggr.name) }}
                                  </span>
                                  <span v-if="i === 0" class="rounded-lg px-2 leading-5 text-[10px] uppercase bg-primary bg-opacity-10 text-primary">
                                    Best Rate
                                  </span>
                                  <SvgoCheckCircle v-else-if="aggr.name === bestRoute.name" class="w-4 success-circle" />
                                </div>
                                <span class="text-xs text-slate-400">
                                  {{ formatDecimal(fromWei(aggr.data.buyTokenAmount, aggr.data.buyToken.decimals).toFixed()) }}
                                  {{ aggr.data.buyToken.symbol }}
                                  ({{ formatUsd(times(fromWei(aggr.data.buyTokenAmount, aggr.data.buyToken.decimals), aggr.data.buyToken.price)) }})</span>
                              </div>
                            </div>
                          </MenuItem>
                          <hr class="last:hidden dark:border-slate-800 border-slate-100">
                        </template>
                      </MenuItems>
                    </transition>
                  </Menu>

                </span>
                <span v-else>
                  -
                </span>
              </div>
              <div
                class="items-center justify-between hidden text-sm font-medium sm:flex text-slate-400"
              >
                <span>
                  Min. Received after slippage ({{ actualSlippage }}%)
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
      <CommonNotification
        v-if="!!error"
        type="error"
        :text="error"
      >
        <template #action>
          <button v-if="swapDetails.data?.aggregators?.length! > 1 " type="button" class="text-xs" @click="setAnotherRoute">
            <span>Retry</span>
          </button>
        </template>
      </CommonNotification>
      <EstimatedFee
        v-else
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
