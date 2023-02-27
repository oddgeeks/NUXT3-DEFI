<script lang="ts" setup>
import { utils } from "ethers";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import NetworkSVG from "~/assets/images/icons/network.svg?component";
import FlowersSVG from "~/assets/images/icons/flowers.svg?component";
import type WalletConnect from "@walletconnect/client";
import { storeToRefs } from "pinia";

const provider = getRpcProvider(634);
const emit = defineEmits(["resolve", "reject"]);

const props = defineProps<{
  payload: any;
  chainId: string;
  wc: WalletConnect;
}>();

const { safe, sendTransaction } = useAvocadoSafe();
const { account } = useWeb3();
const { gasBalance } = storeToRefs(useSafe());
const [submitting, toggle] = useToggle();
const { switchNetworkByChainId } = useNetworks();
const { parseTransactionError } = useErrorHandler();

const {
  data: fee,
  pending,
  error,
} = useEstimatedFee(ref(props.payload.params), {
  chainId: props.chainId,
  immediate: true,
});

const submitDisabled = computed(
  () =>
    submitting.value || pending.value || isBalaceNotEnough.value || error.value
);

const isBalaceNotEnough = computed(() => {
  if (pending.value) return false;
  return toBN(gasBalance.value).lt(fee.value?.max!);
});

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
    id: props.payload.id,
    error: {
      code: -32603,
      message: message,
    },
  });
};

const handleSubmit = async () => {
  try {
    await switchNetworkByChainId(634);

    toggle(true);
    const params = props.payload?.params[0];

    const metadata = encodeDappMetadata({
      name: props.wc.peerMeta?.name!,
      url: props.wc.peerMeta?.url!,
    });

    const transactionHash = await sendTransaction(
      {
        ...params,
        chainId: props.chainId,
      },
      {
        metadata,
      }
    );

    props.wc.approveRequest({
      id: props.payload.id,
      result: transactionHash,
    });

    logActionToSlack({
      message: `Txn on ${props.wc.peerMeta?.url}`,
      type: "success",
      action: "wc",
      txHash: transactionHash,
      chainId: props.chainId,
      account: account.value,
    });

    emit("resolve");

    showPendingTransactionModal(transactionHash, props.chainId, "wc");
  } catch (e) {
    const err = parseTransactionError(e);

    openSnackbar({
      message: err,
      type: "error",
    });

    logActionToSlack({
      message: props.wc.peerMeta?.url + " " + err,
      type: "error",
      action: "wc",
      chainId: props.chainId,
      account: account.value,
    });
  } finally {
    toggle(false);
  }
};

const formatURL = (url: string) => {
  return new URL(url).hostname;
};

const handleReject = () => {
  rejectRequest("Rejected");
  emit("reject");
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-7.5">
    <audio src="/audio/alert.mp3" autoplay></audio>
    <div class="text-lg font-semibold leading-[30px]">Send Transaction</div>

    <div class="flex flex-col gap-2.5">
      <div
        class="dark:bg-gray-850 bg-slate-50 flex flex-col gap-4 rounded-5 py-[14px] px-5"
      >
        <div class="flex justify-between items-center">
          <div class="text-slate-400 flex items-center gap-2.5">
            <FlowersSVG />
            <span class="text-xs leading-5 font-medium">App Name</span>
          </div>

          <div class="flex items-center gap-2.5">
            <a
              rel="noopener noreferrer"
              target="_blank"
              class="text-primary text-sm"
              :href="wc.peerMeta?.url"
            >
              {{ formatURL(wc.peerMeta?.url!) }}
            </a>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-slate-400 flex items-center gap-2.5">
            <NetworkSVG />
            <span class="text-xs leading-5 font-medium">Network</span>
          </div>

          <div class="flex items-center gap-2.5">
            <span class="text-xs font-medium">
              {{ chainIdToName(chainId) }}
            </span>
            <ChainLogo class="w-[18px] h-[18px]" :chain="chainId" />
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-slate-400 flex items-center gap-2.5">
            <GasSVG class="w-4" />
            <span class="text-xs leading-5 font-medium">Gas fees</span>
          </div>

          <div class="flex items-center gap-2.5">
            <span v-if="pending" class="w-20 h-5 loading-box rounded-lg"></span>
            <span
              v-else
              :class="{ 'text-red-alert': isBalaceNotEnough }"
              class="text-xs"
              >{{ fee?.formatted }}</span
            >
            <img
              class="w-[18px] h-[18px]"
              width="18"
              height="18"
              src="https://cdn.instadapp.io/icons/tokens/usdc.svg"
            />
          </div>
        </div>
      </div>

      <CommonNotification v-if="error" type="error" :text="error">
        <template v-if="error.includes('gas')" #action>
          <CommonButton @click="openTopUpGasModal()" size="sm">
            Top-up
          </CommonButton>
        </template>
      </CommonNotification>
    </div>
    <div class="flex justify-between items-center gap-4">
      <CommonButton
        @click="handleReject"
        color="white"
        size="lg"
        class="flex-1 justify-center items-center hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
      >
        Reject
      </CommonButton>

      <CommonButton
        :loading="submitting"
        :disabled="submitDisabled"
        type="submit"
        class="flex-1 justify-center items-center"
        size="lg"
      >
        Submit
      </CommonButton>
    </div>
  </form>
</template>
