<script setup lang="ts">
import { Erc20__factory } from "~~/contracts";

const props = defineProps({
  address: {
    type: String,
    required: true
  },
  chainId: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
});

const { library, account } = useWeb3();
const { switchNetworkByChainId } = useNetworks();
const { sendTransactions, safeAddress, tokenBalances } = useAvocadoSafe();
const token = computed(() => tokenBalances.value.find(t => t.chainId === props.chainId && t.address === props.address)!)
const amount = ref("");

const setMax = () => {
  amount.value = token.value!.balance;
};


const bridgeToChainId = ref(props.chainId === "137" ? "10" : "137")

const bridgeToTokenIndex = ref(0)
const bridgeToTokens = ref<any[]>([])
const bridgeToToken = computed(() => bridgeToTokens.value.length ? bridgeToTokens.value[bridgeToTokenIndex.value] : null)

const txRoute = ref()

watch(() => [props.chainId], async () => {
  bridgeToChainId.value = props.chainId === "137" ? "10" : "137"
}, { immediate: true })

watch(bridgeToChainId, async () => {
  const { data } = await http.get("https://api.socket.tech/v2/token-lists/to-token-list", {
    headers: {
      "api-key": "645b2c8c-5825-4930-baf3-d9b997fcd88c",
    },

    params: {
      fromChainId: props.chainId,
      toChainId: bridgeToChainId.value,
    },
  });
  bridgeToTokens.value = data.result
  bridgeToTokenIndex.value = 0

}, { immediate: true })

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


  txRoute.value = routes.length ? routes[0] : null
})

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

    const txs = []

    for (const userTx of txRoute.value.userTxs) {

      if (userTx.approvalData) {
        const erc20 = Erc20__factory.connect(token.value.address, getRpcProvider(props.chainId))
        const { data } = await erc20.populateTransaction.approve(userTx.approvalData.allowanceTarget,
          userTx.approvalData.minimumApprovalAmount
        )

        txs.push({
          to: token.value.address,
          data,
        })
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
    })

    let transactionHash = await sendTransactions(txs, props.chainId)

    console.log(transactionHash)

    // notify({
    //   message: `${amount.value} ${token.value.symbol
    //     } sent to ${address.value}`,
    // });
    amount.value = "";
    modal.value?.cancel();

    showPendingTransactionModal(transactionHash, props.chainId)

  } catch (e: any) {
    console.log(e)
    notify({
      type: "error",
      message: e.message,
    });
  }

  loading.value = false;
};
</script>

<template>
  <button v-if="disabled" class="
            shadow
            py-2
            px-7
            inline-flex
            justify-center
            items-center
            rounded-[20px]
            bg-slate-800
            text-slate-500 text-sm
            font-semibold
          ">
    Bridge
  </button>

  <CommonInlineModal v-else ref="modal" containerClass="rounded-[20px] md:max-w-md">
    <template #reveal="{ openModal }">
      <slot :openModal="openModal">
        <button @click="openModal" class="
            shadow
            py-2
            px-7
            inline-flex
            justify-center
            items-center
            rounded-[20px]
            bg-blue-500
            hover:bg-blue-600
            text-white text-sm
            font-semibold
          ">
          Bridge
        </button>
      </slot>
    </template>
    <template v-slot="{ closeModal }">
      <div class="relative bg-[#111827] rounded-[20px] px-10 pt-2 pb-12 space-y-8 text-center w-full max-w-[460px]">
        <button class="absolute top-0 right-0 m-6" @click="closeModal" aria-label="Close modal">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="30" rx="15" fill="#1E293B" />
            <path d="M18.5 11.5L11.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M11.5 11.5L18.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>

        <div class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0">
          <img :src="`https://cdn.instadapp.io/icons/tokens/${token.symbol.toLowerCase()}.svg`"
            onerror="this.onerror=null; this.remove();" />
        </div>

        <div>
          <h2>{{ token.name }}</h2>

          <div class="bg-gray-850 mt-4 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]">
            <ChainLogo class="w-5 h-5" :chain="token.chainId" />
            <span class="text-xs text-slate-400 leading-5">{{ chainIdToName(token.chainId) }} Network</span>
          </div>

          <div class="text-slate-400 mt-2">
            Estimated wait time is 10m
          </div>
        </div>

        <div class="space-y-5">
          <div class="space-y-2.5">
            <div class="flex justify-between items-center">
              <span>Amount</span>
              <span>{{ token.balance }} {{ token.symbol }}</span>
            </div>

            <div class="relative">
              <input type="text"
                class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
                placeholder="Enter amount" v-model="amount" />

              <button class="absolute top-0 bottom-0 right-0 mr-5 text-blue-500 hover:text-blue-500"
                @click="setMax">MAX</button>
            </div>

          </div>
          <div class="space-y-2.5">
            <div class="flex justify-between items-center">
              <span>Bridge To</span>
            </div>

            <div class="flex items-center gap-4">
              <select v-model="bridgeToTokenIndex"
                class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full">

                <option v-for="(toToken, index) in bridgeToTokens" :value="index">{{ toToken.name }}</option>
              </select>

              <select v-model="bridgeToChainId"
                class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full">
                <option v-if="chainId !== '137'" :value="137">Polygon</option>
                <!-- <option v-if="chainId !== '1'" :value="1">Mainnet</option> -->
                <option v-if="chainId !== '10'" :value="10">Optimism</option>
                <!-- <option v-if="chainId !== '250'" :value="250">Fantom</option> -->
                <!-- <option v-if="chainId !== '43114'" :value="43114">Avalanche</option> -->
                <option v-if="chainId !== '42161'" :value="42161">Arbitrum</option>
              </select>
            </div>

          </div>
        </div>


        <div class="flex">
          <button :disabled="sendingDisabled" :loading="loading" @click="send"
            class="cursor-pointer bg-blue-500 hover:bg-blue-600 px-4 py-2 capitalize w-full shadow-md rounded-[15px] flex justify-center items-center space-x-2"
            :class="{
              'cursor-not-allowed': loading,
              'bg-blue-400': loading,
            }">
            <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>

            <span>{{ loading ? "Bridging" : "Bridge" }}</span>
          </button>
        </div>
      </div>
    </template>
  </CommonInlineModal>
</template>
