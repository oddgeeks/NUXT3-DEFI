<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";
import PendingBridgeTransaction from "./PendingBridgeTransaction.vue";

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

const { library, account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransactions, safeAddress, tokenBalances } = useAvocadoSafe();
const token = computed(
  () =>
    tokenBalances.value.find(
      (t) => t.chainId === props.chainId && t.address === props.address
    )!
);
const amount = ref("");

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

const txRoute = ref();

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

watch([amount, bridgeToChainId, bridgeToTokenIndex], async () => {
  if (!bridgeToToken.value) {
    return;
  }

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

  txRoute.value = routes.length ? routes[0] : null;
});

const loading = ref(false);
const sendingDisabled = computed(
  () => !token.value || !account.value || loading.value || !txRoute.value
);

const modal = ref();

const send = async () => {
  if (!txRoute.value) {
    return;
  }

  loading.value = false;

  if (sendingDisabled.value) return;

  loading.value = true;
  try {
    await switchNetworkByChainId(420);

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
    amount.value = "";
    modal.value?.cancel();

    useModal().openModal(PendingBridgeTransaction, {
      hash: transactionHash,
      chainId: props.chainId,
    });
  } catch (e: any) {
    console.log(e);
    notify({
      type: "error",
      message: e.message,
    });
  }

  loading.value = false;
};
</script>

<template>
  <div class="space-y-8">
    <div
      class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
    >
      <img
        :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
        onerror="this.onerror=null; this.remove();"
      />
    </div>

    <div>
      <h2>{{ token.name }}</h2>

      <div
        class="bg-gray-850 mt-4 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="token.chainId" />
        <span class="text-xs text-slate-400 leading-5"
          >{{ chainIdToName(token.chainId) }} Network</span
        >
      </div>

      <div class="text-slate-400 mt-2">Estimated wait time is 10m</div>
    </div>

    <div class="space-y-5">
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Amount</span>
          <span>{{ token.balance }} {{ token.symbol }}</span>
        </div>

        <CommonInput placeholder="Enter amount" v-model="amount">
          <template #suffix>
            <button
              class="absolute top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500"
              @click="setMax"
            >
              MAX
            </button>
          </template>
        </CommonInput>
      </div>
      <div class="space-y-2.5">
        <div class="flex justify-between items-center">
          <span>Bridge To</span>
        </div>

        <div class="flex items-center gap-4">
          <CommonSelect
            isValueIndex
            v-model="bridgeToTokenIndex"
            label-key="name"
            :options="bridgeToTokens"
          />

          <CommonSelect
            v-model="bridgeToChainId"
            value-key="value"
            label-key="label"
            :options="selectableChains"
          />
        </div>
      </div>
    </div>

    <CommonButton
      :disabled="sendingDisabled"
      :loading="loading"
      @click="send"
      class="justify-center w-full"
      size="lg"
    >
      Bridge
    </CommonButton>
  </div>
</template>
