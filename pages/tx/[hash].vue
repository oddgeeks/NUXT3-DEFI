<script setup lang="ts">
import LinkSVG from "~/assets/images/icons/external-link.svg?component";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import { serializeError } from "serialize-error";

const router = useRoute();
const provider = getRpcProvider(634);

interface Transaction extends IAvocadoTransaction {
  decodedMetadata?: any;
  isBridge?: boolean;
}

let abortController = ref<AbortController | null>(null);

const {
  data: transaction,
  refresh,
  pending,
  error,
} = useAsyncData(
  router.params.hash as string,
  async () => {
    const data = (await provider.send("api_getTransactionByHash", [
      router.params.hash,
    ])) as Transaction;

    if (!data) {
      throw new Error("Transaction not found");
    }

    data.decodedMetadata = decodeMetadata(data?.data!);
    data.isBridge =
      data.decodedMetadata &&
      data.decodedMetadata?.some((i: any) => i.type === "bridge");

    console.log({
      metadata: data.decodedMetadata,
    });

    return data;
  },
  {
    server: true,
  }
);

const locale = computed(() =>
  typeof window !== "undefined" ? window.navigator.language : "en"
);

const handleRefresh = () => {
  if (!error.value) {
    refresh();
  }
};

const { pause, resume } = useIntervalFn(handleRefresh, 3000, {
  immediate: true,
});

const { data: bridgeStatus, pending: bridgeStatusPending, error: bridgeStatusError } = useAsyncData(
  "bridge-status",
  async () => {
    if (transaction.value?.isBridge) {
      try {
        const bridgeMeta = transaction.value?.decodedMetadata?.find(
          (i: any) => i.type === "bridge"
        ) as any;

        if (!bridgeMeta) return;

        pause();

        if (abortController.value) {
          abortController.value.abort();
        }

        abortController.value = new AbortController();

        const res: any = await Promise.race([
          http("/api/socket/v2/bridge-status", {
            signal: abortController.value.signal,
            params: {
              transactionHash: transaction.value?.hash,
              fromChainId: transaction.value?.chain_id,
              toChainId: bridgeMeta?.toChainId!,
            },
          }),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(
                new Error(
                  "Timeout error: Fetch request took too long to complete."
                )
              );
            }, 3000);
          }),
        ]);

        abortController.value = null;
        resume();

        if (res.result.sourceTxStatus === "FAILED") return "failed";
        return res.result.destinationTxStatus.toLowerCase();
      } catch (e) {
        pause();

        const serialized = serializeError(e)
        if (serialized.message?.includes('user aborted')) return;

        throw new Error("Something went wrong");
      }
    }
  },
  {
    server: false,
    immediate: false,
    lazy: true,
    watch: [transaction],
  }
);

onUnmounted(() => {
  pause();
  refreshNuxtData(router.params.hash);
  clearNuxtData(router.params.hash);
  clearNuxtData("bridge-status");
});
</script>

<template>
  <div class="container flex-1 pb-10">
    <h1 class="mb-5 hidden sm:block">Transaction Details</h1>

    <div
      class="dark:bg-gray-850 bg-slate-50 rounded-5.5 sm:text-sm text-xs font-medium py-5 sm:py-6.5 min-h-[548px] blur"
      v-if="!transaction && pending"
    />

    <div
      v-if="transaction"
      class="sm:dark:bg-gray-850 sm:bg-slate-50 rounded-5.5 sm:text-sm text-xs font-medium sm:py-6.5"
    >
      <div class="flex flex-col gap-4 sm:gap-6.5 sm:px-7.5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Transaction Hash
          </div>
          <div class="flex items-start sm:items-center space-x-2.5 py-2.5 px-3 sm:p-0 dark:bg-gray-850 bg-slate-50 rounded-[14px]">
            <a
              class="text-primary break-all"
              :href="
                getExplorerUrl(transaction.chain_id, `/tx/${transaction.hash}`)
              "
              target="_blank"
              >{{ transaction.hash }}</a
            >
            <Copy :text="transaction.hash" />
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Broadcaster
          </div>
          <div v-if="transaction.from" class="flex items-start sm:items-center space-x-2.5 py-2.5 px-3 sm:p-0 dark:bg-gray-850 bg-slate-50 rounded-[14px]">
            <a
              class="text-primary break-all"
              :href="
                getExplorerUrl(
                  transaction.chain_id,
                  `/address/${transaction.from}`
                )
              "
              target="_blank"
            >
              {{ transaction.from }}
            </a>
            <Copy :text="transaction.from"></Copy>
          </div>
          <span v-else>-</span>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Status
          </div>
          <TransactionStatus :status="transaction.status" />

          <span
            v-if="transaction.revert_reason"
            class="ml-2 text-xs text-red-400"
          >
            ({{ transaction.revert_reason }})
          </span>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Timestamp
          </div>
          <div class="capitalize">
            {{ useTimeAgo(transaction.created_at).value }} ({{
              new Date(transaction.created_at).toLocaleString(locale)
            }})
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150 mt-5 sm:mt-6.5" />

      <div class="sm:px-7.5 py-5 sm:py-6.5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Network
          </div>
          <div class="capitalize flex items-center py-2.5 px-3 sm:p-0 dark:bg-gray-850 bg-slate-50 rounded-[14px]">
            <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

            <span>{{ chainIdToName(transaction.chain_id) }}</span>
          </div>
        </div>
      </div>

      <div v-if="transaction.decodedMetadata">
        <hr class="w-full dark:border-slate-800 border-slate-150" />

        <div class="sm:px-7.5 py-5 sm:py-6.5 flex gap-6.5 flex-col">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
            <div
              class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
            >
              Transaction Action
            </div>
            <div class="flex items-center flex-col gap-6">
              <ActionMetadata
                :metadata="item"
                :key="i"
                :transaction="transaction"
                v-for="(item, i) of transaction.decodedMetadata"
              />
            </div>
          </div>

          <div v-if="transaction?.isBridge" class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
            <div
              class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px] flex items-center gap-2"
            >
              Bridge Status

              <SVGInfo
                v-tippy="
                  'This is a token bridging transaction. Click on the link to check the estimated time for the transaction to be processed.'
                "
                class="w-[18px] h-[18px] text-slate-600 shrink-0"
              />
            </div>
            <TransactionStatus v-if="bridgeStatusError" status="failed" />

            <div
              v-else-if="bridgeStatusPending && !bridgeStatus"
              class="rounded-5 w-24 h-4 loading-box"
            />
            <a
              v-else-if="bridgeStatus"
              class="flex items-center"
              :href="`https://socketscan.io/tx/${transaction.hash}`"
              target="_blank"
            >
              <TransactionStatus :status="bridgeStatus">
                <LinkSVG class="w-4" />
              </TransactionStatus>
            </a>
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="sm:px-7.5 py-5 sm:py-6.5 flex flex-col gap-6.5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Signer
          </div>

          <div
            v-if="transaction.metadata.signer"
            class="flex items-start sm:items-center space-x-2.5 py-2.5 px-3 sm:p-0 dark:bg-gray-850 bg-slate-50 rounded-[14px]"
          >
            <a
              class="text-primary break-all"
              :href="
                getExplorerUrl(
                  transaction.chain_id,
                  `/address/${transaction.metadata.signer}`
                )
              "
              target="_blank"
              >{{ transaction.metadata.signer }}</a
            >

            <Copy :text="transaction.metadata.signer" />
          </div>

          <div v-else class="capitalize">-</div>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]"
          >
            Avocado Wallet
          </div>

          <div
            v-if="transaction.metadata.safe"
            class="flex items-start sm:items-center space-x-2.5 py-2.5 px-3 sm:p-0 dark:bg-gray-850 bg-slate-50 rounded-[14px]"
          >
            <a
              class="text-primary break-all"
              :href="
                getExplorerUrl(
                  transaction.chain_id,
                  `/address/${transaction.metadata.safe}`
                )
              "
              target="_blank"
              >{{ transaction.metadata.safe }}</a
            >

            <Copy :text="transaction.metadata.safe" />
          </div>

          <div v-else class="capitalize">-</div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="sm:px-7.5 flex flex-col pt-5 sm:pt-6.5 gap-6.5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <div
            class="dark:text-slate-400 gap-2.5 flex items-center text-slate-500 md:w-full md:max-w-[235px]"
          >
            Transaction Fee
            <SVGInfo
              v-tippy="
                'This includes the fee that will be paid to the relayer and the integrator.'
              "
              class="w-[18px] h-[18px] text-slate-600 shrink-0 rotate-180"
            />
          </div>
          <div class="capitalize">
            <span v-if="transaction.fee">
              {{ formatUsd(transaction.fee) }}
            </span>
            <span v-else> - </span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="!transaction && !pending"
      class="dark:bg-gray-850 bg-slate-50 rounded-5.5 text-sm font-medium p-16 text-center"
    >
      <p class="mb-2">Sorry, We are unable to locate this TxnHash</p>
    </div>
  </div>
</template>