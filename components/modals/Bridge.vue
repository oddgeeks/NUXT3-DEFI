<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import PendingBridgeTransaction from "./PendingBridgeTransaction.vue";
import { useField, useForm } from "vee-validate";
import * as yup from "yup";

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
const { sendTransactions, safeAddress, tokenBalances } = useAvocadoSafe();
const { fromWei } = useBignumber();
const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === props.chainId && t.address === props.address
    )!
);

const { handleSubmit, errors, meta, resetForm } = useForm({
  validationSchema: yup.object({
    amount: yup
      .string()
      .required()
      .test("max-amount", "Insufficient balance", (value) => {
        const amount = toBN(value);
        const balance = toBN(token.value.balance);

        return amount.gt(0) && amount.lte(balance);
      }),
  }),
});

const { value: amount, meta: amountMeta } = useField<string>("amount");

const result = ref(null);
const txRoute = ref();

const toAmount = computed(() =>
  formatDecimal(
    fromWei(txRoute.value?.toAmount || "0", bridgeToToken?.value?.decimals),
    6
  )
);

const bridgeFee = computed(() =>
  formatDecimal(
    fromWei(
      minus(txRoute.value?.fromAmount || "0", txRoute.value?.toAmount || "0"),
      bridgeToToken?.value?.decimals
    )
  )
);

const hasRouteEmpty = computed(
  () =>  !txRoute.value && meta.value.valid && !loading
);

const setMax = () => {
  amount.value = token.value!.balance;
};

const bridgeToChainId = ref(props.chainId === "137" ? "10" : "137");

const bridgeToTokenIndex = ref(0);
const bridgeToTokens = ref<any[]>([]);
const bridgeToToken = computed(() =>
  bridgeToTokens.value.length
    ? bridgeToTokens.value[bridgeToTokenIndex.value]
    : null
);

const selectableChains = computed(() =>
  [
    {
      value: 137,
      label: "Polygon",
    },
    {
      value: 10,
      label: "Optimism",
    },
    {
      value: 42161,
      label: "Arbitrum",
    },
  ].filter((c) => String(c.value) !== props.chainId)
);

watch(
  () => [props.chainId],
  async () => {
    bridgeToChainId.value = props.chainId === "137" ? "10" : "137";
  },
  { immediate: true }
);

watch(
  bridgeToChainId,
  async () => {
    const { data } = await http.get(
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
    bridgeToTokens.value = data.result;

    let index = data.result.findIndex((t: any) =>
      t.symbol.toLowerCase().includes(token.value.symbol.toLowerCase())
    );

    bridgeToTokenIndex.value = index === -1 ? 0 : index;
  },
  { immediate: true }
);

const fetchQuote = async () => {
  try {
    loading.value = true;
    const transferAmount = toBN(amount.value || "0")
      .times(10 ** bridgeToToken.value.decimals)
      .toFixed(0);

    const { data } = await http.get("https://api.socket.tech/v2/quote", {
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
      },
    });

    const {
      result: { routes },
    } = data;

    result.value = data.result;
    txRoute.value = routes.length ? routes[0] : null;
  } finally {
    loading.value = false;
  }
};

watch([amount, bridgeToChainId, bridgeToTokenIndex], async () => {
  if (!bridgeToToken.value) {
    return;
  }
  fetchQuote();
});

const loading = ref(false);
const sendingDisabled = computed(
  () =>
    !token.value ||
    !account.value ||
    loading.value ||
    !txRoute.value ||
    !meta.value.valid
);

const modal = ref();

const onSubmit = handleSubmit(async () => {
  if (!txRoute.value) {
    return;
  }

  loading.value = false;

  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(75);

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
    });

    let transactionHash = await sendTransactions(txs, props.chainId);

    console.log(transactionHash);

    // notify({
    //   message: `${amount.value} ${token.value.symbol
    //     } sent to ${address.value}`,
    // });
    resetForm()
    modal.value?.cancel();

    useModal().openModal(PendingBridgeTransaction, {
      hash: transactionHash,
      chainId: props.chainId,
    });
  } catch (e: any) {
    console.log(e);
    openSnackbar({
      message: e?.reason ||  "Something went wrong",
      type: "error",
    })
  }

  loading.value = false;
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
        <h2 class="text-lg leading-5 text-center">{{ token.name }}</h2>

        <div
          class="bg-gray-850 px-3 py-[5px] inline-flex justify-center items-center gap-2 rounded-5"
        >
          <ChainLogo class="w-5 h-5" :chain="token.chainId" />
          <span class="text-xs text-slate-400 leading-5"
            >{{ chainIdToName(token.chainId) }} Network</span
          >
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-5">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <h1>Transfer from</h1>
          <span>{{ token.balance }} {{ token.symbol }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommonInput
            min="0.000001"
            type="number"
            step="0.000001"
            inputmode="decimal"
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
            class="bg-gray-850 px-3 max-w-full inline-flex items-center gap-2 rounded-2xl self-start h-[50px]"
          >
            <ChainLogo class="w-6 h-6" :chain="token.chainId" />
            <span class="text-sm leading-5"
              >{{ chainIdToName(token.chainId) }} Network</span
            >
          </div>
        </div>
      </div>
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <h1>Transfer to</h1>
        </div>
        <div class="px-5 pt-[14px] pb-5 bg-gray-850 rounded-5">
          <div class="flex flex-col gap-5">
            <div
              class="grid items-center gap-4 grid-cols-1 md:grid-cols-2 md:gap-x-4 md:gap-y-5"
            >
              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Coin</span>
                <div
                  class="bg-gray-800 w-full px-3 flex py-3 items-center gap-2.5 rounded-2xl"
                >
                  <img
                    width="24"
                    height="24"
                    class="h-6 w-6"
                    :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
                    onerror="this.onerror=null; this.remove();"
                  />
                  <span class="text-sm leading-5">
                    {{ token.name }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col gap-2.5">
                <span class="text-sm">Network</span>
                <CommonSelect
                  v-model="bridgeToChainId"
                  value-key="value"
                  label-key="label"
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

            <div class="flex justify-between items-center">
              <span class="text-slate-400 text-sm font-semibold"
                >Bridge Fee</span
              >
              <span class="text-slate-400 text-sm font-semibold text-right"
                >{{ bridgeFee }} USDC</span
              >
            </div>

            <div class="divider" />

            <div class="flex justify-between items-center">
              <span class="md:text-lg font-semibold !leading-5"
                >You receive</span
              >
              <span
                class="sm:text-2xl text-lg font-semibold text-right !leading-5"
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
        :loading="loading"
        class="justify-center w-full"
        size="lg"
      >
        Bridge
      </CommonButton>
      <p class="text-xs text-center text-slate-400">
        Estimated processing time is 10m.
      </p>

      <Transition
        enter-active-class="duration-300 ease-out"
        enter-from-class="transform opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="transform opacity-0"
      >
        <div
          v-if="hasRouteEmpty"
          class="bg-orange-500 gap-[15px] w-full justify-center flex bg-opacity-10 text-orange-500 rounded-5 p-4 text-sm text-center"
        >
          <span class="text-xs self-center">
            We could not find any routes for your desired transfer.
          </span>
        </div>
      </Transition>
    </div>
  </form>
</template>

<style scoped>
.divider {
  background-image: linear-gradient(
    to right,
    #1e293b 33%,
    rgba(255, 255, 255, 0) 0%
  );
  background-position: bottom;
  background-size: 21px 2px;
  background-repeat: repeat-x;
  border: 0;
  height: 2px;
  position: relative;
}

.divider:after {
  @apply w-5 h-5 rounded-full absolute top-1/2 -right-10 -translate-x-1/2 -translate-y-1/2;
  background-color: #111827;
  content: "";
  display: block;
}

.divider:before {
  @apply w-5 h-5 rounded-full absolute top-1/2 -left-5 -translate-x-1/2 -translate-y-1/2;
  background-color: #111827;
  content: "";
  display: block;
}
</style>
