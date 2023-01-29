<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";
import { Erc20__factory } from "~~/contracts";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";
import { storeToRefs } from "pinia";
import type { IToken } from "~~/stores/tokens";

type IFee = {
  amount: string;
  feesInUsd: string;
  asset: IToken;
};

type IFees = {
  bridge: IFee;
  gas: IFee;
};

const provider = getRpcProvider(634);

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
const { switchNetworkByChainId, networks, getNetworkByChainId } = useNetworks();
const { sendTransactions, safeAddress, tokenBalances, safe } = useAvocadoSafe();
const { fromWei } = useBignumber();
const { parseTransactionError } = useErrorHandler();
const { tokens } = storeToRefs(useTokens());

const loading = ref(false);

const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === props.chainId && t.address === props.address
    )!
);

const { handleSubmit, errors, meta, resetForm, validate } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required("")
      .test("min-amount", "", (value) => {
        const amount = toBN(value);

        return value ? amount.gt(0) : true;
      })
      .test("max-amount", "Insufficient balance", (value) => {
        const amount = toBN(value);
        const balance = toBN(token.value.balance);

        return amount.gt(0) ? amount.lte(balance) : true;
      }),
  }),
});

const { value: amount, meta: amountMeta } = useField<string>("amount");

const toAmount = computed(() =>
  formatDecimal(
    fromWei(txRoute.value?.toAmount || "0", bridgeToToken?.value?.decimals),
    6
  )
);

const nativeCurrency = computed(() => {
  const nativeTokenMeta = getNetworkByChainId(+props.chainId).params
    .nativeCurrency;

  return tokens.value.find(
    (t) =>
      t.chainId == props.chainId &&
      t.symbol.toLowerCase() === nativeTokenMeta?.symbol?.toLowerCase()
  );
});

const isGasBalanceSufficient = computed(() => {
  if (!txRoute.value) return true;

  const gasFee = fees.value.gas;

  const tokenBalance = tokenBalances.value.find(
    (t) =>
      t.chainId == props.chainId &&
      t.symbol.toLowerCase() === gasFee.asset.symbol?.toLowerCase()
  );

  let actualBalance = toBN(tokenBalance?.balance || "0");

  const isSameToken =
    gasFee.asset.symbol?.toLowerCase() === token.value.symbol?.toLowerCase();

  // If the gas fee is in the same token as the token balance, we need to subtract the amount
  if (isSameToken) {
    actualBalance = actualBalance.minus(toBN(amount.value || "0"));
  }

  return actualBalance.gte(toBN(gasFee.amount || "0"));
});

const fees = computed<IFees>(() => {
  const fallback: IFee = {
    amount: "0",
    feesInUsd: "0",
    asset: nativeCurrency.value as IToken,
  };

  if (!txRoute.value) {
    return {
      gas: fallback,
      bridge: fallback,
    };
  }

  const fees = txRoute.value?.userTxs.reduce(
    (acc: IFees, tx: any) => {
      const bridgeFee = tx.steps.reduce((acc: any, step: any) => {
        if (!step?.protocolFees) return acc;

        return {
          amount: fromWei(
            toBN(acc.amount || "0")
              .plus(toBN(step?.protocolFees?.amount || "0"))
              .toFixed(),
            step?.protocolFees?.asset?.decimals
          ).toFixed(),
          feesInUsd: toBN(acc.feesInUsd || "0")
            .plus(toBN(step?.protocolFees?.feesInUsd || "0"))
            .toFixed(),
          asset: step?.protocolFees?.asset,
        };
      }, fallback);

      return {
        gas: {
          amount: fromWei(
            toBN(acc.gas.amount || "0")
              .plus(toBN(tx.gasFees.gasAmount || "0"))
              .toFixed(),
            tx.gasFees.asset.decimals
          ).toFixed(),
          feesInUsd: toBN(acc.gas.feesInUsd || "0")
            .plus(toBN(tx.gasFees.feesInUsd || "0"))
            .toFixed(),
          asset: tx.gasFees.asset,
        },
        bridge: {
          amount: toBN(bridgeFee.amount)
            .plus(toBN(acc.bridge.amount || "0"))
            .toFixed(),
          feesInUsd: toBN(bridgeFee.feesInUsd)
            .plus(toBN(acc.bridge.feesInUsd || "0"))
            .toFixed(),
          asset: bridgeFee.asset,
        },
      };
    },
    {
      gas: fallback,
      bridge: fallback,
    }
  );

  return fees;
});

const setMax = () => {
  amount.value = token.value!.balance;
};

const bridgeToChainId = ref(props.chainId === "137" ? "10" : "137");

const selectableChains = computed(() =>
  networks.filter(
    (c) => String(c.chainId) !== props.chainId && c.chainId !== 634
  )
);

watch(
  () => [props.chainId],
  async () => {
    bridgeToChainId.value = props.chainId === "137" ? "10" : "137";
  },
  { immediate: true }
);

const bridgeToToken = computed(() => {
  const t = bridgeToTokens.value?.result?.find(
    (t: any) => t.symbol.toLowerCase() === token.value.symbol.toLowerCase()
  );

  if (t) {
    return t;
  }

  return bridgeToTokens.value?.result?.find((t: any) =>
    t.symbol.toLowerCase().includes(token.value.symbol.toLowerCase())
  );
});

const { data: bridgeToTokens } = useAsyncData(
  "bridge-tokens",
  async () => {
    const { data }: { data: IBridgeTokensResponse } = await http.get(
      "https://api.socket.tech/v2/token-lists/to-token-list",
      {
        headers: {
          "api-key": "645b2c8c-5825-4930-baf3-d9b997fcd88c",
        },
        params: {
          fromChainId: props.chainId,
          toChainId: bridgeToChainId.value,
        },
      }
    );
    return data;
  },
  {
    server: false,
    immediate: true,
    watch: [bridgeToChainId],
  }
);

const txRoute = computed(() => {
  const [route] = data.value?.result.routes || [];
  return route ?? null;
});

const { data, error, pending } = useAsyncData(
  "bridge-data",
  async () => {
    const { valid } = await validate();

    if (!valid) return;
    if(!bridgeToToken.value) throw new Error("No bridge token found");

    const transferAmount = toBN(amount.value || "0")
      .times(10 ** bridgeToToken.value.decimals)
      .toFixed(0);

    const { data }: { data: IBridgeResponse } = await http.get(
      "https://api.socket.tech/v2/quote",
      {
        headers: {
          "api-key": "645b2c8c-5825-4930-baf3-d9b997fcd88c",
        },

        params: {
          fromTokenAddress: token.value.address,
          fromChainId: props.chainId,
          toTokenAddress: bridgeToToken.value.address,
          toChainId: bridgeToChainId.value,
          fromAmount: transferAmount,
          userAddress: safeAddress.value,
          recipient: safeAddress.value,
          singleTxOnly: true,
          bridgeWithGas: false,
          defaultSwapSlippage: 1,
          sort: "output",
          isContractCall: true,
          // excludeBridges: [
          //   "hyphen",
          //   "anyswap-router-v4",
          //   "anyswap-router-v6",
          //   "stargate",
          // ],
        },
      }
    );

    if (!data.result.routes.length) {
      throw new Error(
        "We could not find any routes for your desired transfer."
      );
    }

    return data;
  },
  {
    server: false,
    watch: [amount, bridgeToToken],
  }
);

const { data: fee, pending: feePending } = useAsyncData(
  "bridge-fee",
  async () => {
    const txs = await getTxs();

    const message = await safe.value?.generateSignatureMessage(
      txs,
      +props.chainId
    );

    return provider.send("txn_estimateFeeWithoutSignature", [
      message,
      account.value,
      props.chainId,
    ]);
  },
  {
    server: false,
    watch: [txRoute],
  }
);

const sendingDisabled = computed(
  () =>
    !token.value ||
    !account.value ||
    loading.value ||
    pending.value ||
    !txRoute.value ||
    !meta.value.valid ||
    !isGasBalanceSufficient.value
);

const handleSwapToken = () => {
  const balancedToken = tokenBalances.value.find(
    (t) =>
      gt(t.balance, "0") &&
      t.chainId == props.chainId &&
      t.symbol !== nativeCurrency.value?.symbol
  );

  const fallbackToken = tokens.value.find((i) => i.chainId == props.chainId);
  const isSameToken =
    token.value?.symbol.toLowerCase() ===
    nativeCurrency.value?.symbol.toLowerCase();

  const fromAddress = !isSameToken
    ? token.value
    : balancedToken || fallbackToken;

  emit("destroy");

  const fromAmount = toBN(fees.value.gas.amount).times(nativeCurrency.value?.price || "0").div(
    fromAddress?.price || "0"
  ).toFixed()

  openSwapModal(fromAddress?.address!, props.chainId, nativeCurrency.value?.address!, fromAmount);
};

const getTxs = async () => {
  const txs = [];

  for (const userTx of txRoute.value.userTxs) {
    if (userTx.approvalData) {
      const erc20 = Erc20__factory.connect(
        token.value.address,
        getRpcProvider(props.chainId)
      );
      const { data } = await erc20.populateTransaction.approve(
        userTx.approvalData.allowanceTarget,
        userTx.approvalData.minimumApprovalAmount
      );

      txs.push({
        to: token.value.address,
        data,
      });
    }
  }

  const { data: buildTx } = await http.post(
    "https://api.socket.tech/v2/build-tx",
    {
      route: txRoute.value,
    },
    {
      headers: {
        "api-key": "645b2c8c-5825-4930-baf3-d9b997fcd88c",
      },
    }
  );

  txs.push({
    to: buildTx.result.txTarget,
    data: buildTx.result.txData,
    value: buildTx.result.value,
  });

  return txs;
};

const onSubmit = handleSubmit(async () => {
  if (!txRoute.value) {
    return;
  }
  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(634);

    const txs = await getTxs();

    let transactionHash = await sendTransactions(txs, props.chainId, {
      metadata: "0x",
    });

    logActionToSlack({
      message: `${formatDecimal(amount.value)} ${formatSymbol(
        token.value.symbol
      )} from ${chainIdToName(token.value.chainId)} to ${chainIdToName(
        bridgeToChainId.value
      )}`,
      action: "bridge",
      chainId: props.chainId,
      txHash: transactionHash,
      account: account.value,
    });

    resetForm();
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
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <form @submit="onSubmit" class="flex gap-7.5 flex-col">
    <div class="flex justify-center flex-col items-center">
      <img
        width="40"
        height="40"
        class="h-10 w-10 mb-7.5"
        :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
        onerror="this.onerror=null; this.remove();"
      />
      <div class="flex flex-col gap-[14px]">
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
          <h1>Transfer from</h1>
          <span class="uppercase">{{ token.balance }} {{ token.symbol }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonInput
            type="numeric"
            :error-message="amountMeta.dirty ? errors['amount'] : ''"
            name="amount"
            placeholder="Enter amount"
            v-model="amount"
          >
            <template #suffix>
              <button
                type="button"
                class="absolute top-0 bottom-0 right-0 mr-5 text-sm text-blue-500 hover:text-blue-500"
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
          <h1>Transfer to</h1>
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
                    onerror="this.onerror=null; this.remove();"
                  />
                  <span class="text-sm w-full leading-5 text-shadow overflow-hidden whitespace-nowrap">
                    {{ token.name }}
                    <span class="uppercase"> ({{ token.symbol }})</span>
                  </span>
                </div>
              </div>

              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Network</span>
                <CommonSelect
                  v-model="bridgeToChainId"
                  value-key="chainId"
                  label-key="name"
                  :options="selectableChains"
                >
                  <template #button-prefix>
                    <ChainLogo class="w-6 h-6" :chain="bridgeToChainId" />
                  </template>
                  <template #item-prefix="{ value }">
                    <ChainLogo class="w-6 h-6" :chain="value" />
                  </template>
                </CommonSelect>
              </div>
            </div>

            <div class="flex flex-col gap-2.5">
              <div class="flex justify-between items-center">
                <span class="text-slate-400 text-sm font-semibold"
                  >Bridge Fee</span
                >
                <span
                  class="text-slate-400 text-sm font-semibold text-right uppercase"
                >
                  {{ formatDecimal(fees.bridge?.amount, 4) }}

                  {{ fees.bridge?.asset.symbol }}

                  ({{ formatUsd(fees.bridge?.feesInUsd) }})
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400 text-sm font-semibold"
                  >Source Gas Fee</span
                >
                <span
                  class="text-slate-400 text-sm font-semibold text-right uppercase"
                >
                  {{ formatDecimal(fees.gas?.amount, 4) }}
                  {{ fees.gas.asset.symbol }}
                  ({{ formatUsd(fees.gas.feesInUsd) }})
                </span>
              </div>
              <div
                v-if="!isGasBalanceSufficient"
                class="flex items-center justify-between bg-red-alert bg-opacity-10 rounded-7.5 text-red-alert py-2.5 px-[14px]"
              >
                <div class="flex items-center gap-2.5">
                  <SVGInfo class="w-[18px] h-[18px]" />
                  <p class="text-sm">
                    Not enough
                    <span class="uppercase">{{ fees.gas.asset.symbol }}</span>
                    balance
                  </p>
                </div>
                <CommonButton
                  @click="handleSwapToken"
                  class="h-7.5 flex gap-[6px] items-center justify-center text-sm px-[14px]"
                >
                  <RefreshSVG class="w-[14px] h-[14px]" />
                  Swap Token
                </CommonButton>
              </div>
            </div>

            <div class="divider" />

            <div class="flex justify-between items-center">
              <span class="md:text-lg font-semibold !leading-5"
                >You receive</span
              >
              <span
                class="sm:text-2xl text-lg font-semibold text-right !leading-5 uppercase"
                >{{ toAmount }} {{ token.symbol }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex gap-4 flex-col">
      <CommonButton
        type="submit"
        :disabled="sendingDisabled"
        :loading="loading || pending"
        class="justify-center w-full"
        size="lg"
      >
        Bridge
      </CommonButton>

      <p class="text-xs text-center text-slate-400">
        Estimated processing time is
        {{ txRoute ? `~${Math.round(txRoute.serviceTime / 60)}m` : "~10m" }}.
      </p>

      <EstimatedFee :chain-id="chainId" :loading="feePending" :data="fee" />

      <Transition
        enter-active-class="duration-300 ease-out"
        enter-from-class="transform opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="transform opacity-0"
      >
        <div
          v-if="error"
          class="bg-orange-400 gap-[15px] w-full justify-center flex bg-opacity-10 text-orange-400 rounded-5 p-4 text-sm text-center"
        >
          <span class="text-xs self-center">
            {{ error }}
          </span>
        </div>
      </Transition>
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
