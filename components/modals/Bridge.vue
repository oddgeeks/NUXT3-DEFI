<script setup lang="ts">
import { serialize } from 'error-serializer'
import RefreshSVG from '~/assets/images/icons/refresh.svg?component'

const props = defineProps({
  address: {
    type: String,
    required: true,
  },
  chainId: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['destroy'])

const { account } = useWeb3()
const { sendTransactions, tokenBalances } = useAvocadoSafe()
const { toWei } = useBignumber()
const { parseTransactionError } = useErrorHandler()
const { authorisedNetworks } = useAuthorities()

const esimatedFeeRetryCount = ref(0)

const fromChainId = ref<string>(props.chainId)

const fromToken = ref(
  tokenBalances.value.find(
    t => t.chainId == fromChainId.value && t.address === props.address,
  )!,
)

// eslint-disable-next-line vue/no-dupe-keys
const {
  txRoute,
  toChainId,
  amount,
  recivedValueInUsd,
  recievedAmount,
  form,
  nativeCurrency,
  nativeFee,
  isInsufficientBalance,
  bridgeToToken,
  disabled,
  loading,
  transactions,
  routes,
  bridgeFee,
  selectableToChains,
  handleSwapToken,
  bridgeTokens,
  fromTokens,
  sortTokensBestMatch,
  amountInUsd,
  isInputUsd,
  dirty,
  toggleMax,
  toggleDirty,
} = useBridge(fromToken, fromChainId)

const { pending, error, data } = useEstimatedFee(
  transactions.data,
  fromChainId,
  {
    disabled: () => isInsufficientBalance.value,
  },
  {
    active: true,
    count: esimatedFeeRetryCount,
    max: 1,
    cb: changeRouteForRetry,
    onError: handleEstimatedError,
  },
)

const availableRoutes = computed(() => routes.data.value?.result?.routes || [])
const fallbackRoutes = computed(() => availableRoutes.value.filter(i => getRouteProvider(i)?.displayName !== bridgeProtocol.value?.displayName))

function handleEstimatedError(e: any) {
  const err = serialize(e)

  const message = `Bridge Estimated fee failed: ${err.message}
<@UK9L88BS7>, <@U02NZML3JJ0>
${'`Route`'} ${JSON.stringify(txRoute.value)}
`

  logActionToSlack({
    account: account.value,
    action: 'bridge',
    type: 'error',
    message,
    chainId: fromChainId.value,
  })
}

function changeRouteForRetry() {
  if (esimatedFeeRetryCount.value > 1)
    return

  openSnackbar({
    message: 'Retrying with another route...',
    type: 'info',
  })

  const [route] = fallbackRoutes.value

  if (!route)
    return

  txRoute.value = route
  esimatedFeeRetryCount.value += 1
}

const availableTokens = computed(() => {
  return tokenBalances.value.filter((i) => {
    const isChainMatch = i.chainId == fromChainId.value
    const isSupportedTokensExist = !!fromTokens.data.value?.length

    const isSupported = isSupportedTokensExist ? fromTokens.data.value?.some(f => f.address?.toLocaleLowerCase() === i.address?.toLowerCase() && String(f.chainId) == String(i.chainId)) : true

    return isChainMatch && isSupported
  })
},
)

watchThrottled(fromTokens.data, () => {
  const isTokenAvailable = availableTokens.value.some(i =>
    i.address?.toLocaleLowerCase() === fromToken.value.address?.toLocaleLowerCase()
    && String(i.chainId) == String(fromToken.value.chainId))

  if (!isTokenAvailable && availableTokens.value?.length) {
    const sortedTokens = sortTokensBestMatch(availableTokens.value, fromToken.value.symbol)
    fromToken.value = sortedTokens[0]
  }
}, {
  throttle: 1000,
})

const bridgeProtocol = computed(() => getRouteProvider(txRoute.value))

function setMax() {
  toggleDirty()
  toggleMax(true)

  amount.value = toBN(fromToken.value!.balance).toFixed()
}

const feeInfoMessage = computed(() => {
  if (!bridgeFee.value?.asset || !nativeFee.value)
    return

  const amounts = [
    {
      amount: bridgeFee.value?.amount,
      symbol: bridgeFee.value.asset?.symbol?.toUpperCase(),
      amountInUsd: bridgeFee.value?.feesInUsd,
    },
    {
      amount: nativeFee.value,
      symbol: nativeCurrency.value?.symbol?.toLowerCase(),
      amountInUsd: times(nativeFee.value!, nativeCurrency.value?.price || 0),
    },
  ]

  const filteredAmounts = amounts.filter(item => toBN(item.amount).gt('0'))

  if (!filteredAmounts.length)
    return

  const formattedAmounts = filteredAmounts.map((i) => {
    return `${formatDecimal(i.amount, 4)} ${i.symbol} (${formatUsd(i.amountInUsd)})`
  })

  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
  const formattedString = formatter.format(formattedAmounts)

  return `The third-party bridge provider will charge an additional fee of ${formattedString} for their bridging service.`
})

function getRouteProvider(route?: IRoute) {
  if (!route?.userTxs?.length)
    return
  const [tx] = route.userTxs

  const bridge = tx?.steps?.find((i: any) => i.type === 'bridge')

  return bridge?.protocol
}

const onSubmit = form.handleSubmit(async () => {
  if (!txRoute.value || !bridgeToToken.value)
    return

  try {
    const metadata = encodeBridgeMetadata({
      amount: toWei(amount.value, fromToken.value.decimals),
      bridgeFee: toWei(bridgeFee.value.amount, bridgeFee.value.asset.decimals),
      nativeToken: bridgeFee.value.asset.address,
      receiver: account.value,
      fromToken: fromToken.value.address,
      toToken: bridgeToToken.value.address,
      toChainId: toChainId.value,
    })

    const transactionHash = await sendTransactions(
      transactions.data.value!,
      fromChainId.value,
      {
        metadata,
      },
      'bridge',
    )
    if (!transactionHash) {
      // tracking mode
      return
    }

    logActionToSlack({
      message: generateSlackMessage(metadata, fromChainId.value),
      action: 'bridge',
      chainId: fromChainId.value,
      txHash: transactionHash,
      account: account.value,
      amountInUsd: toBN(recivedValueInUsd.value).toString(),
    })

    form.resetForm()
    emit('destroy')

    showPendingTransactionModal(transactionHash, fromChainId.value, 'bridge')
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
      action: 'bridge',
      account: account.value,
      errorDetails: err.parsed,
    })
  }
})
</script>

<template>
  <form class="flex gap-7.5 flex-col" @submit="onSubmit">
    <div class="flex gap-[14px]">
      <CommonTxTypeIcon class="w-10 h-10">
        <template #icon>
          <SvgoBridge />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-[20px]">
          Bridge
        </h1>
        <h2 class="font-medium text-xs text-slate-400 leading-5">
          Migrate tokens across multiple networks with lowest slippage.
        </h2>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <h1 class="text-sm flex items-center justify-between">
          Transfer from

          <CommonToggle v-model="isInputUsd" text="Input USD" />
        </h1>

        <div
          class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-5 pt-3.5 px-5 pb-5 gap-3 sm:gap-5"
        >
          <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div class="flex flex-col flex-1 gap-2.5">
              <span class="text-sm">Coin</span>
              <TokenSelection
                v-model="fromToken"
                class="relative w-full flex items-center gap-2.5 max-h-12 rounded-2xl border dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 px-4 py-3 text-left"
                :tokens="availableTokens"
              />
            </div>
            <div class="flex flex-col flex-1 gap-2.5">
              <span class="text-sm">Network</span>
              <CommonSelect
                v-model="fromChainId"
                value-key="chainId"
                label-key="name"
                icon-key="icon"
                :options="authorisedNetworks"
              >
                <template #button-prefix>
                  <ChainLogo class="w-6 h-6" :chain="fromChainId" />
                </template>
                <template #item-prefix="{ value }">
                  <ChainLogo class="w-6 h-6" :chain="value" />
                </template>
              </CommonSelect>
            </div>
          </div>
          <div class="flex flex-col gap-2.5">
            <div class="flex justify-between">
              <span class="text-sm">Amount</span>
              <div class="flex items-center gap-2.5">
                <span class="uppercase text-sm">
                  {{ formatDecimal(fromToken.balance) }} {{ fromToken.symbol }}
                </span>
                <button
                  type="button"
                  class="text-sm text-primary"
                  @click="setMax"
                >
                  MAX
                </button>
              </div>
            </div>

            <CommonCurrencyInput
              v-if="isInputUsd"
              v-model="amountInUsd"
              :dirty="dirty"
              styled
              input-classes="!py-3"
              autofocus
              :error-message="form.errors.value.amount"
              name="amount-usd"
              placeholder="Enter amount"
              @beforeinput="toggleMax(false)"
            >
              <template #suffix>
                <span class="text-sm text-left text-slate-400 absolute right-5">
                  {{ formatDecimal(amount) }}
                </span>
              </template>
            </CommonCurrencyInput>

            <CommonInput
              v-else
              v-model="amount"
              type="numeric"
              autofocus
              :error-message="form.errors.value.amount"
              name="amount"
              placeholder="Enter amount"
              @beforeinput="toggleMax(false)"
            >
              <template #suffix>
                <span class="flex text-sm text-slate-400">
                  {{ formatUsd(amountInUsd) }}
                </span>
              </template>
            </CommonInput>
          </div>
        </div>
      </div>
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <h1 class="text-sm">
            Transfer to
          </h1>
        </div>
        <div
          class="px-5 pt-4 sm:pt-[14px] pb-5 dark:bg-gray-850 bg-slate-50 rounded-5"
        >
          <div class="flex flex-col gap-4 sm:gap-5">
            <div
              class="grid items-center gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 md:gap-x-4 md:gap-y-5"
            >
              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Coin</span>

                <TokenSelection
                  v-model="bridgeToToken"
                  :sort="false"
                  :pending="bridgeTokens.pending.value"
                  class="relative flex items-center gap-2.5 max-h-12 rounded-2xl border dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 px-4 py-3 text-left"
                  :tokens="bridgeTokens.data"
                />
              </div>
              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Network</span>
                <CommonSelect
                  v-model="toChainId"
                  value-key="chainId"
                  label-key="name"
                  :options="selectableToChains"
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
            <div class="flex flex-col gap-2 sm:gap-2.5">
              <div class="flex justify-between items-center">
                <span class="text-sm text-slate-400 font-medium">
                  Estimated processing time
                </span>
                <span class="text-slate-400 font-medium">
                  {{
                    txRoute
                      ? `~${Math.round(txRoute.serviceTime / 60)}m`
                      : "~10m"
                  }}
                </span>
              </div>
              <div
                class="items-center justify-between hidden text-sm font-medium sm:flex text-slate-400"
              >
                <span>
                  Route Through
                </span>
                <div
                  v-if="routes.pending.value"
                  style="width: 140px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <span
                  v-else-if="!!txRoute && !!availableRoutes?.length"
                  class="capitalize hidden sm:flex items-center gap-2.5"
                >
                  <Menu v-slot="{ open }" as="div" class="relative">
                    <MenuButton class="flex items-center gap-2.5 rounded-xl px-3 py-2 border border-slate-150 dark:border-slate-750">
                      <img :src="bridgeProtocol?.icon" class="w-5 h-5">
                      {{ bridgeProtocol?.displayName }}
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
                        <template v-for="route, i in availableRoutes" :key="route.routeId">
                          <MenuItem as="button" type="button" class="font-medium w-full text-left px-4 py-[14px] first:pt-0 last-of-type:pb-0" @click="txRoute = route">
                            <div class="flex gap-2">
                              <img width="20" height="20" :src="getRouteProvider(route)?.icon" class="w-5 h-5">
                              <div class="flex flex-col gap-1 w-full">
                                <div class="flex justify-between w-full">
                                  <span class="text-white">
                                    {{ getRouteProvider(route)?.displayName }}
                                  </span>
                                  <span v-if="i === 0" class="rounded-lg px-2 leading-5 text-[10px] uppercase bg-primary bg-opacity-10 text-primary">
                                    Best Rate
                                  </span>
                                  <SvgoCheckCircle v-else-if="txRoute.routeId === route.routeId" class="w-4 success-circle" />
                                </div>
                                <span class="text-xs text-slate-400">
                                  {{ formatDecimal(fromWei(route?.toAmount || '0', bridgeToToken?.decimals).toFixed()) }}
                                  {{ bridgeToToken?.symbol }}
                                  ({{ formatUsd(times(fromWei(route?.toAmount || '0', bridgeToToken?.decimals), bridgeToToken?.price || '0')) }})</span>
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
            </div>

            <div class="divider" />

            <div
              class="flex justify-between items-start sm:items-center whitespace-nowrap"
            >
              <span class="md:text-lg font-semibold !leading-5">You receive</span>
              <div
                v-if="routes.pending.value"
                style="width: 140px; height: 20px"
                class="rounded-lg loading-box"
              />
              <span
                v-else
                class="sm:text-2xl text-sm font-semibold text-right !leading-5 uppercase inline-flex flex-wrap gap-2 sm:gap-2.5 justify-end"
              >
                <span>{{ formatDecimal(recievedAmount) }}
                  {{ bridgeToToken?.symbol || fromToken.symbol }}</span>

                <span class="text-slate-400 text-sm">({{ formatUsd(recivedValueInUsd) }})</span>
              </span>
            </div>
          </div>
        </div>

        <EstimatedFee :loading="pending" :data="data" :error="error" />

        <Transition name="fade">
          <p v-if="feeInfoMessage" class="text-slate-400 mt-1 font-medium leading-6 flex items-start text-xs">
            <SvgoExclamationCircle class="mr-2.5 mt-1 h-4.5 w-4.5 shrink-0 text-slate-500" />
            <span class="block">
              {{ feeInfoMessage }}
            </span>
          </p>
        </Transition>

        <CommonNotification
          v-if="transactions.error.value"
          type="error"
          :text="transactions.error.value?.message"
        />
        <CommonNotification
          v-if="isInsufficientBalance"
          type="error"
          :text="`Not enough ${nativeCurrency?.symbol.toUpperCase()} balance`"
        >
          <template #action>
            <CommonButton
              size="sm"
              class="flex gap-[6px] items-center justify-center"
              @click="handleSwapToken"
            >
              <RefreshSVG class="w-[14px] h-[14px]" />
              Swap Token
            </CommonButton>
          </template>
        </CommonNotification>
        <CommonNotification
          v-if="routes.error.value"
          type="warning"
          :text="routes.error.value?.message"
        />
      </div>

      <div class="flex gap-4 flex-col">
        <CommonButton
          type="submit"
          :disabled="disabled || pending || !!error"
          :loading="loading || pending"
          class="justify-center w-full"
          size="lg"
        >
          Bridge
        </CommonButton>
      </div>
    </div>
  </form>
</template>

<style scoped>
.divider {
  @apply bg-dashed-pattern dark:bg-dashed-pattern-dark;
  background-position: bottom;
  background-size: 21px 2px;
  background-repeat: repeat-x;
  border: 0;
  height: 2px;
  position: relative;
}

.divider:after {
  @apply w-5 h-5 rounded-full absolute top-1/2 -right-10 -translate-x-1/2 -translate-y-1/2 dark:bg-gray-950 bg-white;
  content: "";
  display: block;
}

.divider:before {
  @apply w-5 h-5 rounded-full absolute top-1/2 -left-5 -translate-x-1/2 -translate-y-1/2 dark:bg-gray-950 bg-white;
  content: "";
  display: block;
}
</style>
