<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";

const emit = defineEmits(["destroy"]);

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
});

const { account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransactions } = useAvocadoSafe();
const { toWei } = useBignumber();
const { parseTransactionError } = useErrorHandler();

const {
  txRoute,
  toChainId,
  token,
  amount,
  toAmount,
  form,
  nativeCurrency,
  nativeFee,
  nativeFeeInUsd,
  isInsufficientBalance,
  bridgeToToken,
  disabled,
  loading,
  estimatedFee,
  transactions,
  routes,
  bridgeFee,
  selectableChains,
  handleSwapToken,
} = useBridge({
  fromChainId: props.chainId,
  tokenAddress: props.address,
});

const setMax = () => {
  amount.value = toBN(token.value!.balance).decimalPlaces(6, 1).toString();
};

const onSubmit = form.handleSubmit(async () => {
  if (!txRoute.value) {
    return;
  }

  try {
    await switchNetworkByChainId(634);

    const metadata = encodeBridgeMetadata({
      amount: toWei(amount.value, token.value.decimals),
      bridgeFee: toWei(bridgeFee.value.amount, bridgeFee.value.asset.decimals),
      nativeToken: bridgeFee.value.asset.address,
      receiver: account.value,
      fromToken: token.value.address,
      toToken: bridgeToToken.value.address,
      toChainId: toChainId.value,
    });

    let transactionHash = await sendTransactions(
      transactions.data.value!,
      props.chainId,
      {
        metadata,
      }
    );

    logActionToSlack({
      message: `${formatDecimal(amount.value)} ${formatSymbol(
        token.value.symbol
      )} from ${formatSymbol(
        chainIdToName(token.value.chainId),
        false
      )} to ${formatSymbol(chainIdToName(toChainId.value), false)}`,
      action: "bridge",
      chainId: props.chainId,
      txHash: transactionHash,
      account: account.value,
    });

    form.resetForm();
    emit("destroy");

    showPendingTransactionModal(transactionHash, props.chainId, "bridge");
  } catch (e: any) {
    const err = parseTransactionError(e);
    openSnackbar({
      message: err,
      type: "error",
    });

    logActionToSlack({
      message: err,
      type: "error",
      action: "bridge",
      account: account.value,
    });
  }
});
</script>

<template>
  <form @submit="onSubmit" class="flex gap-7.5 flex-col">
    <div class="flex justify-center flex-col gap-7.5 items-center">
      <div class="relative flex mx-auto h-10 w-10 rounded-full flex-shrink-0">
        <img
          width="40"
          height="40"
          class="h-10 w-10 rounded-[inherit]"
          :src="token.logoURI"
          :onerror="onImageError"
        />
      </div>

      <div class="flex flex-col gap-[15px]">
        <h2 class="text-lg leading-5 text-center">
          {{ token.name }}
          <span class="uppercase"> ({{ token.symbol }})</span>
        </h2>

        <div
          class="dark:bg-gray-850 bg-slate-50 px-3 py-[5px] self-center inline-flex justify-center items-center gap-2 rounded-5"
        >
          <ChainLogo class="w-5 h-5" :chain="token.chainId" />
          <span class="text-xs text-slate-400 leading-5 w-fit">{{
            chainIdToName(token.chainId)
          }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <h1 class="text-sm">Transfer from</h1>
          <span class="uppercase text-sm"
            >{{ formatDecimal(token.balance) }} {{ token.symbol }}</span
          >
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonInput
            type="numeric"
            :error-message="
              form.meta.value.dirty ? form.errors.value['amount'] : ''
            "
            name="amount"
            placeholder="Enter amount"
            v-model="amount"
          >
            <template #suffix>
              <button
                type="button"
                class="absolute top-0 bottom-0 right-0 mr-5 text-sm text-primary"
                @click="setMax"
              >
                MAX
              </button>
            </template>
          </CommonInput>

          <div
            class="dark:bg-gray-850 bg-slate-50 px-3 max-w-full inline-flex items-center gap-2 rounded-2xl self-start h-[50px]"
          >
            <ChainLogo class="w-6 h-6" :chain="token.chainId" />
            <span class="text-sm leading-5">{{
              chainIdToName(token.chainId)
            }}</span>
          </div>
        </div>
      </div>
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <h1 class="text-sm">Transfer to</h1>
        </div>
        <div class="px-5 pt-[14px] pb-5 dark:bg-gray-850 bg-slate-50 rounded-5">
          <div class="flex flex-col gap-5">
            <div
              class="grid items-center gap-4 grid-cols-1 md:grid-cols-2 md:gap-x-4 md:gap-y-5"
            >
              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Coin</span>
                <div
                  class="dark:bg-gray-800 bg-slate-100 w-full px-3 flex py-3 items-center gap-2.5 rounded-2xl"
                >
                  <img
                    width="24"
                    height="24"
                    class="h-6 w-6"
                    :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
                    :onerror="onImageError"
                  />
                  <span
                    class="text-sm w-full leading-5 text-shadow overflow-hidden whitespace-nowrap"
                  >
                    {{ token.name }}
                    <span class="uppercase"> ({{ token.symbol }})</span>
                  </span>
                </div>
              </div>

              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Network</span>
                <CommonSelect
                  v-model="toChainId"
                  value-key="chainId"
                  label-key="name"
                  :options="selectableChains"
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

            <div class="flex flex-col gap-2.5">
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
              <div class="flex justify-between items-center">
                <span class="text-slate-400 text-sm font-medium"
                  >Bridge Fee</span
                >
                <span
                  class="text-slate-400 text-sm font-medium text-right uppercase"
                >
                  {{ formatDecimal(bridgeFee.amount, 4) }}

                  {{ bridgeFee?.asset.symbol }}

                  ({{ formatUsd(bridgeFee?.feesInUsd) }})
                </span>
              </div>
              <div
                v-if="!isZero(nativeFee!)"
                class="flex justify-between items-center"
              >
                <span
                  class="text-slate-400 inline-flex items-center gap-2 text-sm font-medium"
                  >Source Gas Fee
                  <SVGInfo
                    v-tippy="
                      'This fee is a requirement from the underlying bridge provider to cover the gas cost on target chain.'
                    "
                    class="text-primary"
                  />
                </span>
                <span
                  class="text-slate-400 text-sm font-medium text-right uppercase"
                >
                  {{ formatDecimal(nativeFee!) }}
                  {{ nativeCurrency?.symbol }}
                  ({{ formatUsd(nativeFeeInUsd) }})
                </span>
              </div>
            </div>

            <div class="divider" />

            <div class="flex justify-between items-center">
              <span class="md:text-lg font-semibold !leading-5"
                >You receive</span
              >
              <span
                class="sm:text-2xl text-lg font-semibold text-right !leading-5 uppercase"
              >
                {{ toAmount }} {{ token.symbol }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <EstimatedFee
        :chain-id="chainId"
        :loading="estimatedFee.pending.value"
        :data="estimatedFee.data.value"
      />
      <CommonNotification
        v-if="isInsufficientBalance"
        type="error"
        :text="`Not enough ${nativeCurrency?.symbol.toUpperCase()} balance`"
      >
        <template #action>
          <CommonButton
            size="sm"
            @click="handleSwapToken"
            class="flex gap-[6px] items-center justify-center"
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
        :disabled="disabled"
        :loading="loading"
        class="justify-center w-full"
        size="lg"
      >
        Bridge
      </CommonButton>
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
