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
const { swapAggregatorURL, swapAggregatorAccessToken } = storeToRefs(useEnvironmentState())

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
const { getRpcProviderByChainId } = useShared()
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
      = name === 'Ethereum' ? 'mainnet' : name.replaceAll(' ', '-').toLowerCase()

    const data: ISwapResponse = await http('/swap',
      {
        baseURL: swapAggregatorURL.value,
        signal: abortController.value?.signal,
        params: {
          network: actualName,
          buyToken: swap.value.buyToken.address,
          sellToken: swap.value.sellToken.address,
          sellAmount: toWei(sellAmount.value, swap.value.sellToken.decimals),
          maxSlippage: actualSlippage.value,
          slippage: actualSlippage.value,
          user: safeAddress.value,
          access_token: swapAggregatorAccessToken.value,
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

    selectedRoute.value = best
    fallbackRoutes.value = data?.aggregators.slice(1)
    aggregators.value = data?.aggregators
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

const aggregators = ref<IAggregator[]>([])
const selectedRoute = ref<IAggregator>()
const fallbackRoutes = ref<IAggregator[]>([])

function userChangeRoute(route: IAggregator) {
  selectedRoute.value = route
  fallbackRoutes.value = aggregators.value.filter(i => i.name !== route.name)
}

function resetRetryCounts() {
  txRetryCount.value = 0
  esimatedFeeRetryCount.value = 0
}

const priceImpact = computed(() =>
  toBN(selectedRoute?.value?.data?.priceImpact || 0)
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
  return fromWei(
    swapDetails.value?.data?.data.buyTokenAmount || 0,
    swap.value.buyToken.decimals,
  )
    .div(toBN(1).plus(toBN(actualSlippage.value).div(100))).toFixed()
})

const formattedMinRecievedAfterSlippage = computed(() => formatDecimal(minRecievedAfterSlippage.value))

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

const { data: txActions } = useAsyncData(
  async () => {
    if (!selectedRoute.value)
      return
    return await createRouteBasedTxActions(selectedRoute.value)
  },
  {
    watch: [selectedRoute],
    server: false,
  },
)

/**
 * Creates a set of txActions based on the selected route
 * @param route
 */
async function createRouteBasedTxActions(route?: IAggregator): Promise<TransactionsAction[]> {
  const { valid } = await validate()

  if (!valid)
    throw new Error('Some input data is missing or invalid')

  if (!route)
    throw new Error('Route not found')

  const address = route.data.to

  const erc20 = Erc20__factory.connect(
    address,
    getRpcProviderByChainId(toChainId.value),
  )

  const txActions: TransactionsAction[] = []
  if (swap.value.sellToken.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
    const { data } = await erc20.populateTransaction.approve(
      route.data.allowanceSpender || address,
      route.data.sellTokenAmount,
    )

    txActions.push({
      to: swap.value.sellToken.address,
      data,
    })
  }

  txActions.push({
    to: address,
    data: route.data.calldata,
    value: route.data.value,
  })

  return txActions
}

const txRetryCount = ref(0)

const totalRetries = computed(() => {
  return txRetryCount.value + esimatedFeeRetryCount.value
})

/**
 * Changes the route if the current route fails for any reason and increments the retryCount
 * The current implementation supports cycling through all the fallback routes
 * Retry policy is set to 1
 */
function changeRouteForRetry(retryCount: Ref<number>, maxRetry = 1) {
  if (fallbackRoutes.value.length > totalRetries.value && retryCount.value < maxRetry) {
    const nextRoute = fallbackRoutes.value[totalRetries.value]
    selectedRoute.value = nextRoute
    retryCount.value++
    console.log(`Switching to route ${nextRoute.name}`)
    return nextRoute
  }
}

const esimatedFeeRetryCount = ref(0)

const {
  data,
  pending: feePending,
  error,
} = useEstimatedFee(txActions, toChainId, {
  cb: () => {
    resume()
    refreshing.value = false
  },
},
{
  active: true,
  count: esimatedFeeRetryCount,
  max: 1,
  cb: changeRouteForRetry,
},
)

const onSubmit = handleSubmit(async () => {
  try {
    pause()

    const minRecievedAfterSlippageInWei = toWei(minRecievedAfterSlippage.value, swap.value.buyToken.decimals)

    const metadata = encodeSwapMetadata({
      buyAmount: minRecievedAfterSlippageInWei,
      sellAmount: swapDetails.value?.data?.data.sellTokenAmount!,
      buyToken: swapDetails.value?.data?.data.buyToken.address!,
      sellToken: swap.value.sellToken.address,
      receiver: account.value,
      protocol: utils.formatBytes32String(selectedRoute?.value?.name || ''),
    })

    if (!txActions.value?.length)
      throw new Error('No transaction actions found')

    const transactionHash = await sendTransactions(
      txActions.value,
      toChainId.value,
      {
        metadata,
      },
      'swap',
    )

    if (!transactionHash)
      return

    logActionToSlack({
      message: generateSlackMessage(metadata, toChainId.value),
      action: 'swap',
      account: account.value,
      chainId: toChainId.value,
      txHash: transactionHash,
      amountInUsd: sellAmountInUsd.value,
    })

    resetForm()
    emit('destroy')

    showPendingTransactionModal({
      hash: transactionHash,
      chainId: toChainId.value,
      type: 'swap',
    })
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
    if (selectedRoute.value?.name !== swapDetails.value.data?.aggregators[0]?.name)
      return

    refreshing.value = true
    fetchSwapDetails()
  },
})

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
  resetRetryCounts()
})

onUnmounted(() => {
  abortController.value?.abort()
})
</script>

<template>
  <form novalidate class="flex flex-col" @submit="onSubmit">
    <ModalTitle class="border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <template #icon>
        <SvgoRefresh class="-rotate-45" />
      </template>
      <template #title>
        Swap
      </template>
      <template #subtitle>
        Trade tokens on multiple networks at best price.
      </template>
    </ModalTitle>
    <div class="flex flex-col items-center justify-center gap-7.5 p-5 pb-0 sm:p-7.5 sm:pb-0 sm:pt-5">
      <div class="flex w-full flex-col gap-[15px]">
        <div
          class="mx-auto flex w-full items-center justify-between gap-2 rounded-full"
        >
          <p class="rounded-full border border-[#1e293b] px-5 py-1 text-xs">
            <span class="hidden sm:inline"> Processing on the</span> <ChainLogo class="inline h-6 w-6" :chain="toChainId" /> {{ networks.find(network => network.chainId === parseInt(toChainId))?.name }} Network
          </p>
          <CommonToggle v-model="inputUSDToggle" text="Input USD" />
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5 sm:pt-5">
      <div class="flex flex-col gap-4">
        <div
          class="relative flex flex-col gap-4 rounded-5 border-2 border-transparent bg-gray-900 px-5 py-4  focus-within:border-gray-800 focus-within:bg-gray-850"
        >
          <div class="flex">
            <div
              v-if="isLoading && !isSellAmountFocused"
              class="flex flex-1 items-center"
            >
              <div
                style="width: 100px; height: 28px"
                class="loading-box rounded-lg"
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
                class="w-full flex-1 rounded-none !p-0 text-[26px] leading-[48px] placeholder:!text-[26px]"
                :model-value="toBN(sellAmountInUsd).toNumber()"
                @focus="isSellAmountFocused = true"
                @blur="isSellAmountFocused = false"
                @input="handleUsdChange"
              />
            </div>
            <TokenSelection
              v-model="swap.sellToken"
              :tokens="availableTokens"
              class="bg-gray-900"
            />
          </div>
          <div class="flex items-center justify-between text-sm text-gray-400">
            <div
              v-if="isLoading"
              style="width: 60px; height: 24px"
              class="loading-box rounded-lg"
            />
            <p
              v-else
              class="font-medium leading-6"
            >
              {{ !inputUSDToggle ? `${formatUsd(toBN(sellAmountInUsd).toNumber())}` : `${sellAmount ? sellAmount : 0}` }}
            </p>
            <div class="ml-auto flex items-center gap-2.5 uppercase">
              <span class="font-medium">{{ formatDecimal(sellTokenBalance) }}
                {{ swap.sellToken?.symbol }}</span>
              <button type="button" class="text-primary" @click="setMax">
                MAX
              </button>
            </div>
          </div>
          <span
            v-if="sellAmountMeta.dirty && errors['sell-amount']"
            class="mt-2 flex items-center gap-2 text-left text-xs text-red-alert"
          >
            <SVGInfo /> {{ errors["sell-amount"] }}
          </span>
          <button
            type="button"
            class="absolute bottom-[-26px] left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-slate-600  ring-[6px] ring-gray-975"
            @click="swapTokens"
          >
            <ArrowLeft class="h-5 w-5 -rotate-90 text-gray-400" />
          </button>
        </div>

        <div
          class="flex flex-col gap-4 rounded-5 border-2  border-transparent bg-gray-900  px-5 py-4 focus-within:border-gray-800 focus-within:bg-gray-850"
        >
          <div class="flex">
            <div
              v-if="isLoading && !isUsdBuyAmountFocused"
              class="flex flex-1 items-center"
            >
              <div
                style="width: 100px; height: 28px"
                class="loading-box rounded-lg"
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
                class="w-full flex-1 rounded-none !p-0 text-[26px] leading-[48px] placeholder:!text-[26px]"
                :model-value="toBN(buyAmountInUsd).toNumber()"
                @focus="isUsdBuyAmountFocused = true"
                @blur="isUsdBuyAmountFocused = false"
                @input="handleUsdChange"
              />
            </div>
            <TokenSelection
              v-model="swap.buyToken"
              :tokens="availableBuyTokens"
              class="bg-gray-900"
            />
          </div>
          <div class="flex items-center justify-between text-sm text-gray-400">
            <div
              v-if="isLoading"
              style="width: 60px; height: 24px"
              class="loading-box rounded-lg"
            />
            <p
              v-else
              class="font-medium leading-6"
            >
              {{ !inputUSDToggle ? `${formatUsd(toBN(buyAmountInUsd).toNumber())}` : `${buyAmount ? buyAmount : 0}` }}
            </p>

            <div class="ml-auto flex items-center gap-2.5 uppercase">
              <span class="font-medium">{{ formatDecimal(buyTokenBalance) }}
                {{ swap.buyToken?.symbol }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-5">
        <div class="space-y-2.5">
          <div class="rounded-5 bg-gray-850 px-5 pb-5 pt-[14px]">
            <div class="flex flex-col gap-5">
              <details open class="group flex flex-col">
                <summary
                  class="flex cursor-pointer justify-between text-sm font-semibold"
                >
                  <span class="inline-flex gap-2.5">
                    Slippage

                    <button
                      v-tippy="'Slippage is the difference between the expected price of an order and the price when the order actually executes. The slippage tolerance % lets you decide how much slippage you are willing to accept for a trade.'
                      "
                      type="button"
                    >
                      <QuestionCircleSVG class="h-5 w-5 text-primary" />
                    </button>
                  </span>
                  <ChevronDownSVG
                    class="w-5 text-gray-400 group-open:rotate-180"
                  />
                </summary>
                <div class="mt-4 flex flex-1 items-end gap-4">
                  <div class="flex flex-1 flex-col gap-2.5">
                    <CommonSelect
                      v-model="slippage"
                      value-key="value"
                      label-key="label"
                      :container-classes="!customSlippage ? '!border-primary' : ''
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
                  class="mt-4 flex items-center gap-2 text-left text-xs text-red-alert"
                >
                  <SVGInfo />
                  {{ slippageError }}
                </span>
              </details>

              <div class="ticket-divider" />

              <div class="flex flex-col gap-4">
                <div
                  class="flex flex-col justify-between gap-1.5 text-sm font-medium uppercase text-gray-400 sm:flex-row sm:items-center sm:gap-0"
                >
                  <div
                    v-if="isLoading"
                    style="width: 140px; height: 20px"
                    class="loading-box rounded-lg"
                  />
                  <div
                    v-else
                    class="flex w-full items-center justify-between sm:justify-start sm:gap-2"
                  >
                    <span>1 {{ swap.sellToken?.symbol }}</span>
                    <span class="hidden sm:block"> = </span>
                    <span>{{ buyTokenAmountPerSellToken }}
                      {{ swap.buyToken?.symbol }}</span>
                  </div>
                  <div
                    v-if="isLoading"
                    style="width: 140px; height: 20px"
                    class="loading-box rounded-lg"
                  />
                  <div
                    v-else
                    class="flex w-full items-center justify-between sm:justify-end sm:gap-2"
                  >
                    <span>1 {{ swap.buyToken?.symbol }}</span>
                    <span class="hidden sm:block"> = </span>
                    <span>{{ sellTokenAmountPerBuyToken }}
                      {{ swap.sellToken?.symbol }}</span>
                  </div>
                </div>
                <div
                  class="hidden items-center justify-between text-sm font-medium text-gray-400 sm:flex"
                >
                  <span>
                    Route Through
                  </span>
                  <div
                    v-if="isLoading"
                    style="width: 140px; height: 20px"
                    class="loading-box rounded-lg"
                  />
                  <span
                    v-else-if="!!selectedRoute && swapDetails.data?.aggregators?.length"
                    class="hidden items-center gap-2.5 capitalize sm:flex"
                  >
                    <Menu v-slot="{ open }" as="div" class="relative">
                      <MenuButton class="flex items-center gap-2.5 rounded-xl border border-slate-750 px-3 py-2">
                        <ProtocolLogo class="h-5 w-5" :name="selectedRoute.name" />
                        {{ formatProtocol(selectedRoute.name) }}
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
                          class="absolute left-1/2 top-12 z-20 w-[300px] origin-center -translate-x-1/2 rounded-5 border border-gray-800 bg-gray-850 py-4"
                        >
                          <template v-for="aggr, i in swapDetails.data?.aggregators" :key="aggr.name">
                            <MenuItem as="button" type="button" class="w-full px-4 py-[14px] text-left font-medium first:pt-0 last-of-type:pb-0" @click="userChangeRoute(aggr)">
                              <div class="flex gap-2">
                                <ProtocolLogo class="h-5 w-5" :name="aggr.name" />
                                <div class="flex w-full flex-col gap-1">
                                  <div class="flex w-full justify-between">
                                    <span class="text-white">
                                      {{ formatProtocol(aggr.name) }}
                                    </span>
                                    <span v-if="i === 0" class="rounded-lg bg-primary bg-opacity-10 px-2 text-[10px] uppercase leading-5 text-primary">
                                      Best Rate
                                    </span>
                                    <SvgoCheckCircle v-else-if="aggr.name === selectedRoute.name" class="success-circle w-4" />
                                  </div>
                                  <span class="text-xs text-gray-400">
                                    {{ formatDecimal(fromWei(aggr.data.buyTokenAmount, aggr.data.buyToken.decimals).toFixed()) }}
                                    {{ aggr.data.buyToken.symbol }}
                                    ({{ formatUsd(times(fromWei(aggr.data.buyTokenAmount, aggr.data.buyToken.decimals), aggr.data.buyToken.price)) }})</span>
                                </div>
                              </div>
                            </MenuItem>
                            <hr class="border-gray-800 last:hidden">
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
                  class="hidden items-center justify-between text-sm font-medium text-gray-400 sm:flex"
                >
                  <span>
                    Min. Received after slippage ({{ actualSlippage }}%)
                  </span>
                  <div
                    v-if="isLoading"
                    style="width: 140px; height: 20px"
                    class="loading-box rounded-lg"
                  />
                  <span v-else class="uppercase">
                    {{ formattedMinRecievedAfterSlippage }}
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
                    class="loading-box rounded-lg"
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
      </div>

      <div class="flex flex-col gap-4">
        <CommonButton
          type="submit"
          :disabled="sendingDisabled"
          :loading="isSubmitting || swapDetails.pending || feePending"
          class="w-full justify-center"
          size="lg"
        >
          Swap
        </CommonButton>
      </div>
      <SessionLocked class="mx-auto" />
    </div>
  </form>
</template>

<style scoped>
.radio {
  @apply w-5 h-5 rounded-full border-[6.5px] border-slate-600 mr-3 shrink-0;
}
</style>
