<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

const router = useRoute();
const provider = getRpcProvider(634);

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
    ])) as Promise<IAvocadoTransaction>;

    if (!data) {
      throw new Error("Transaction not found");
    }

    return data;
  },
  {
    server: true,
  }
);

const metadata = computed(() =>
  transaction.value?.data ? decodeMetadata(transaction.value?.data!) : undefined
);

const locale = computed(() =>
  typeof window !== "undefined" ? window.navigator.language : "en"
);

const isBridge = computed(() =>
  metadata.value?.length &&
  metadata.value?.some((i: any) => i.type === "bridge")
);

const handleRefresh = () => {
  if (!error.value) {
    refresh();
  }
};

const { pause } = useIntervalFn(handleRefresh, 3000, {
  immediate: true,
});

const bridgeStatus = computedAsync(async () => {
  if (isBridge.value && metadata.value && metadata.value.length > 0) {
    const res: any = await http(
      '/api/socket/v2/bridge-status',
      {
        params: {
          transactionHash: transaction.value?.hash,
          fromChainId: transaction.value?.chain_id,
          toChainId: (metadata.value[0] as any).toChainId
        },
      }
    );
    return res.result.destinationTxStatus.toLowerCase();
  }
});

onMounted(() =>
  console.log({
    metadata,
  })
);

onUnmounted(() => {
  pause();
  refreshNuxtData(router.params.hash);
  clearNuxtData(router.params.hash);
});
</script>

<template>
  <div class="container flex-1 md:pb-10">
    <h1 class="mb-5">Transaction Details</h1>

    <div class="dark:bg-gray-850 bg-slate-50 rounded-5.5 text-sm font-medium py-6.5 min-h-[548px] blur"
      v-if="!transaction && pending" />

    <div v-if="transaction" class="dark:bg-gray-850 bg-slate-50 rounded-5.5 text-sm font-medium py-6.5">
      <div class="flex flex-col gap-6.5 px-7.5">
        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Transaction Hash
          </div>
          <div class="flex items-center space-x-2.5">
            <a class="text-primary" :href="
              getExplorerUrl(transaction.chain_id, `/tx/${transaction.hash}`)
            " target="_blank">{{ transaction.hash }}</a>
            <Copy :text="transaction.hash" />
          </div>
        </div>

        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Broadcaster
          </div>
          <div class="flex items-center space-x-2.5">
            <a class="text-primary" :href="
              getExplorerUrl(
                transaction.chain_id,
                `/address/${transaction.from}`
              )
            " target="_blank">
              {{ transaction.from }}
            </a>
            <Copy :text="transaction.from"></Copy>
          </div>
        </div>

        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Status
          </div>
          <TransactionStatus :status="transaction.status" />
        </div>

        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Timestamp
          </div>
          <div class="capitalize">
            {{ useTimeAgo(transaction.created_at).value }} ({{
              new Date(transaction.created_at).toLocaleString(locale)
            }})
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150 mt-6.5" />

      <div class="px-7.5 py-6.5">
        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Network
          </div>
          <div class="capitalize flex items-center">
            <ChainLogo class="w-5 h-5 mr-2.5" :chain="transaction.chain_id" />

            <span>{{ chainIdToName(transaction.chain_id) }}</span>
          </div>
        </div>
      </div>

      <div v-if="metadata">
        <hr class="w-full dark:border-slate-800 border-slate-150" />

        <div class="px-7.5 py-6.5 flex gap-6.5 flex-col">
          <div class="flex">
            <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
              Transaction Action
            </div>
            <div class="flex items-center flex-col gap-6">
              <ActionMetadata :metadata="item" :key="i" :transaction="transaction" v-for="(item, i) of metadata" />
            </div>
          </div>

          <div v-if="isBridge" class="flex">
            <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px] flex items-center gap-2">
              Bridge Status

              <SVGInfo v-tippy="
                'This is a token bridging transaction. Click on the link to check the estimated time for the transaction to be processed.'
              " class="w-[18px] h-[18px] text-slate-600 shrink-0" />
            </div>
            <div>
              <div
                v-if="bridgeStatus"
                class="flex items-center gap-2 capitalize text-red-500"
                :class="{
                  '!text-yellow': bridgeStatus === 'pending',
                  '!text-green-400': bridgeStatus === 'completed'
                }"
              >
                <a :href="`https://socketscan.io/tx/${transaction.hash}`" target="_blank">{{ bridgeStatus }}</a>
                <Copy :text="transaction.hash" />
              </div>
              <div v-else class="rounded-5 w-24 h-4 loading-box"></div>
            </div>
          </div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="px-7.5 py-6.5 flex flex-col gap-6.5">
        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Signer
          </div>

          <div v-if="transaction.metadata.signer" class="flex items-center space-x-2.5">
            <a class="text-primary" :href="
              getExplorerUrl(
                transaction.chain_id,
                `/address/${transaction.metadata.signer}`
              )
            " target="_blank">{{ transaction.metadata.signer }}</a>

            <Copy :text="transaction.metadata.signer" />
          </div>

          <div v-else class="capitalize">-</div>
        </div>

        <div class="flex items-center">
          <div class="dark:text-slate-400 text-slate-500 md:w-full md:max-w-[235px]">
            Avocado Wallet
          </div>

          <div v-if="transaction.metadata.safe" class="flex items-center space-x-2.5">
            <a class="text-primary" :href="
              getExplorerUrl(
                transaction.chain_id,
                `/address/${transaction.metadata.safe}`
              )
            " target="_blank">{{ transaction.metadata.safe }}</a>

            <Copy :text="transaction.metadata.safe" />
          </div>

          <div v-else class="capitalize">-</div>
        </div>
      </div>

      <hr class="w-full dark:border-slate-800 border-slate-150" />

      <div class="px-7.5 flex flex-col pt-6.5 gap-6.5">
        <div class="flex items-center">
          <div class="dark:text-slate-400 gap-2.5 flex items-center text-slate-500 md:w-full md:max-w-[235px]">
            Transaction Fee
            <SVGInfo v-tippy="
              'This includes the fee that will be paid to the relayer and the integrator.'
            " class="w-[18px] h-[18px] text-slate-600 shrink-0" />
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

    <div v-else-if="!transaction && !pending" class="bg-gray-850 rounded-5.5 text-sm font-medium p-16 text-center">
      <p class="mb-2">Sorry, We are unable to locate this TxnHash:</p>
      <p>{{ $route.params.hash }}</p>
    </div>
  </div>
</template>
