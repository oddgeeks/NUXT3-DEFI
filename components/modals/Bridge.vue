<script setup lang="ts">
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
} = useBridge(fromToken, fromChainId)

const { pending, error, data } = useEstimatedFee(
  transactions.data,
  fromChainId,
  {
    disabled: () => isInsufficientBalance.value,
  },
)

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

const bridgeProtocol = computed<Protocol>(() => {
  if (!txRoute.value?.userTxs?.length)
    return
  const [tx] = txRoute.value.userTxs

  const bridge = tx?.steps?.find((i: any) => i.type === 'bridge')

  return bridge?.protocol
})

function setMax() {
  amount.value = toBN(fromToken.value!.balance).decimalPlaces(6, 1).toString()
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
        <h1 class="text-sm">
          Transfer from
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
            <CommonInput
              v-model="amount"
              type="numeric"
              autofocus
              :error-message="form.errors.value.amount"
              name="amount"
              placeholder="Enter amount"
            >
              <template #suffix>
                <span class="flex text-sm text-slate-400">
                  {{
                    formatUsd(
                      toBN(fromToken.price || 0)
                        .times(amount || 0)
                        .decimalPlaces(2),
                    )
                  }}
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
                  Bridge Route
                </span>

                <div
                  v-if="routes.pending.value"
                  style="width: 140px; height: 20px"
                  class="rounded-lg loading-box"
                />
                <span
                  v-else-if="bridgeProtocol?.displayName"
                  class="capitalize hidden sm:flex items-center gap-2.5"
                >
                  <img class="w-5 h-5" :src="bridgeProtocol.icon">
                  {{ bridgeProtocol.displayName }}
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
