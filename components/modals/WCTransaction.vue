<script lang="ts" setup>
import type WalletConnect from "@walletconnect/client";
import { storeToRefs } from "pinia";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";

const provider = getRpcProvider(634);
const emit = defineEmits(["resolve", "reject"]);

const props = defineProps<{
  payload: any;
  chainId: string;
  wc: WalletConnect
}>();

const { safe } = useAvocadoSafe();
const { account } = useWeb3()
const { gasBalance } = storeToRefs(useSafe());
const [submitting, toggle] = useToggle()
const { switchNetworkByChainId } = useNetworks();


const { data: fee, pending } = useAsyncData(
  "swap-fee",
  async () => {
    const message = await safe.value?.generateSignatureMessage(
      props.payload?.params,
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
    immediate: true,
  }
);

const formattedFee = computed(() =>
  calculateEstimatedFee({ chanId: props.chainId, ...fee.value })
);

// const exceedsGasBalance = computed(() => {
//   if (pending.value) return false
//   return  lt(gasBalance.value, formattedFee.value)
// });

onMounted(() => {
  document.title = "(1) Avocado";

  injectFavicon("/icons/favicon-alert.ico");
});

onBeforeUnmount(() => {
  document.title = "Avocado";

  injectFavicon("/icons/favicon.ico");
});

const rejectRequest = (message: string) => {
   props.wc.rejectRequest({
      id:  props.payload.id,
      error: {
        code: -32603,
        message: message,
      },
    });
}

const handleSubmit = async() => {
  try {
    await switchNetworkByChainId(634);

    toggle(true)
    const params = props.payload?.params[0];

    const hash = await safe.value?.sendTransaction({
      ...params,
      chainId: props.chainId,
    });


    props.wc.approveRequest({
      id:  props.payload.id,
      result: hash,
    });

    emit("resolve");
  } catch (error: any) {
    rejectRequest(error.message)
  } finally {
    toggle(false)
  }
};

const handleReject = () => {
  rejectRequest('Rejected')
  emit("reject");
}

</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-7.5">
    <audio src="/audio/alert.mp3" autoplay></audio>
    <div class="text-center">
      <div
        class="w-10 h-10 mb-7.5 rounded-full bg-blue-500 flex items-center justify-center mx-auto"
      >
        <ArrowRight class="-rotate-45" />
      </div>
      <h1 class="mb-[14px] text-lg leading-5">Send Transaction</h1>
      <div class="flex flex-col justify-center gap-[15px] items-center">
        <div
          class="dark:bg-gray-850 bg-slate-50 px-2 pr-3 py-1 inline-flex justify-center items-center space-x-2 rounded-[20px]"
        >
          <ChainLogo class="w-5 h-5" :chain="chainId" />
          <span class="text-xs text-slate-400 leading-5">{{
            chainIdToName(chainId)
          }}</span>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <div class="px-[18px] py-[14px] rounded-5 bg-slate-50 dark:bg-gray-850">
        <div class="flex flex-col gap-2.5">
          <dl class="text-xs font-medium flex justify-between">
            <dt class="text-slate-400">Estimated transaction fee</dt>
            <dd class="loading-box rounded-5 w-16 h-5" v-if="pending"></dd>
            <dd v-else>{{ formattedFee }} USDC</dd>
          </dl>
          <dl class="text-xs font-medium flex justify-between">
            <dt class="text-slate-400">Transaction nonce</dt>
            <dd>91</dd>
          </dl>
        </div>
        <details class="mt-4">
          <summary class="w-full flex items-center justify-between">
            <span class="text-xs">Advanced</span>
            <ChevronDownSVG class="text-slate-400" />
          </summary>
          <dl class="text-xs font-medium flex justify-between mt-2.5">
            <dt class="text-slate-400">Gas limit</dt>
            <dd>13400000</dd>
          </dl>
        </details>
      </div>

      <div class="px-[18px] py-[14px] rounded-5 bg-slate-50 dark:bg-gray-850">
        <details>
          <summary class="w-full flex items-center justify-between">
            <span class="text-xs">Encoded Actions</span>
            <ChevronDownSVG class="text-slate-400" />
          </summary>
          <div class="max-h-[180px] overflow-y-auto mt-2.5">
            <pre class="text-xs text-slate-400">
             {{ JSON.stringify(payload?.params, null, 2) }}
          </pre
            >
          </div>
        </details>
      </div>
    </div>
    <div class="flex gap-4">
      <CommonButton @click="handleReject" class="flex-1 justify-center" size="lg" color="white"
        >Reject</CommonButton
      >
      <CommonButton :disable="submitting" :loading="submitting" type="submit" class="flex-1 justify-center" size="lg"
        >Submit</CommonButton
      >
    </div>
  </form>
</template>
