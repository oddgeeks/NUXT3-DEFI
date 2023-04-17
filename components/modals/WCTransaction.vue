<script lang="ts" setup>
import NetworkSVG from "~/assets/images/icons/network.svg?component";
import FlowersSVG from "~/assets/images/icons/flowers.svg?component";
import SVGClockCircle from "~/assets/images/icons/clock-circle.svg?component";

import type WalletConnect from "@walletconnect/client";

const emit = defineEmits(["resolve", "reject"]);

const props = defineProps<{
  payload: any;
  chainId: string;
  wc: WalletConnect;
  metadata: string;
  isSign?: boolean;
  signMessageDetails?: any;
}>();

const { sendTransactions, safeAddress } = useAvocadoSafe();
const { account } = useWeb3();
const [submitting, toggle] = useToggle();
const { parseTransactionError } = useErrorHandler();

const submitDisabled = computed(
  () => submitting.value || pending.value || !!error.value
);

onMounted(async () => {
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

const calculateDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleString();
};

const transactions = computed(() => {
  const [transactionOrTransactions] = props.payload.params;

  return Array.isArray(transactionOrTransactions)
    ? transactionOrTransactions
    : [transactionOrTransactions];
});

const options = computed(() => {
  const [transactionOrTransactions, chainId, options] = props.payload.params;

  return options || {};
});

const {
  data: fee,
  pending,
  error,
} = useEstimatedFee(transactions, ref(props.chainId), {
  immediate: true,
  options: options.value,
});

const handleSubmit = async () => {
  try {
    toggle(true);

    const transactionHash = await sendTransactions(
      transactions.value,
      props.chainId,
      {
        metadata: props.metadata,
        ...options.value,
      }
    );

    props.wc.approveRequest({
      id: props.payload.id,
      result: transactionHash,
    });

    logActionToSlack({
      message: `${props.isSign ? "Permit2 Approval" : "Txn"} on ${
        props.wc.peerMeta?.url
      }`,
      type: "success",
      action: "wc",
      txHash: transactionHash,
      chainId: props.chainId,
      account: account.value,
    });

    emit("resolve", true);

    showPendingTransactionModal(transactionHash, props.chainId, "wc");
  } catch (e: any) {
    const err = parseTransactionError(e);

    openSnackbar({
      message: err.formatted,
      type: "error",
    });

    logActionToSlack({
      message: `${props.isSign ? "Permit2 Approval" : "Txn"} ${
        props.wc.peerMeta?.url
      } ${err}`,
      type: "error",
      action: "wc",
      chainId: props.chainId,
      account: account.value,
      errorDetails: err.parsed,
    });
  } finally {
    toggle(false);
  }
};

const { data: simulationDetails } = useAsyncData(
  "simulationDetails",
  () => {
    return http("/api/simulate", {
      method: "POST",
      body: {
        actions: transactions.value.map((i) => {
          console.log(i);
          return {
            target: i.to,
            data: i.data,
            value: i?.value || "0",
            operation: i?.operation ? String(i?.operation) : "0",
          };
        }),
        avocadoSafe: safeAddress.value,
        chainId: props.chainId,
        id: options.value?.id,
      },
    }) as Promise<ISimulation>;
  },
  {
    immediate: true,
    server: false,
  }
);

const hasSimulationDetails = computed(() => {
  if (!simulationDetails.value) return false;
  return Object.values(simulationDetails.value.balanceChange).some(
    (i: any[]) => i?.length > 0
  );
});

const formatURL = (url: string) => {
  return new URL(url).hostname;
};

const handleReject = () => {
  rejectRequest("Rejected");
  emit("reject");
};

onUnmounted(() => {
  clearNuxtData("simulationDetails");
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-7.5">
    <audio src="/audio/alert.mp3" autoplay></audio>
    <div class="font-semibold leading-[30px] text-center sm:text-left">
      <span v-if="isSign">Send Transaction: Permit2 Approval</span>
      <span v-else>Send Transaction</span>
    </div>
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
        <EstimatedFee
          wrapperClass="!p-0"
          :loading="pending"
          :data="fee"
          :error="error"
        />

        <template v-if="isSign && signMessageDetails">
          <div class="flex justify-between items-center">
            <div class="text-slate-400 flex items-center gap-2.5">
              <SVGClockCircle class="w-4" />
              <span class="text-xs leading-5 font-medium">Exprires at</span>
            </div>

            <div class="flex items-center gap-2.5 text-sm">
              {{ calculateDate(signMessageDetails.expiration) }}
            </div>
          </div>
        </template>
      </div>
    </div>
    <SimulationDetails
      v-if="hasSimulationDetails"
      :chainId="chainId"
      :details="simulationDetails"
      :hasError="!!error"
    />
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
