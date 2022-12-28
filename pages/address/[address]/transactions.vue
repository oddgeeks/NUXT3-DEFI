<script setup lang="ts">
import type { Ref } from "vue";
type ITransactionResponse = {
  data: IAvocadoTransaction[];
  page: number;
  total: number;
};

const router = useRoute();
const provider = getRpcProvider(75);

const limit = 20;
const page = computed(() => parseInt(router.query.page) || 1) as Ref<number>;

const defaultTransactions: ITransactionResponse = {
  data: [],
  page: 1,
  total: 0,
};

const { data: transactions } = useAsyncData(
  async () => {
    const transactions: ITransactionResponse = await provider.send(
      "api_getTransactionsByOwner",
      [router.params.address, { page: page.value, limit }]
    );

    if (!transactions) {
      return defaultTransactions;
    }

    return transactions;
  },
  {
    watch: [page],
    default: () => defaultTransactions,
  }
);
</script>

<template>
  <div class="container flex flex-col gap-5 flex-1 md:pb-10">
    <h1>Transactions</h1>

    <div class="relative flex-1">
      <div class="overflow-hidden">
        <div
          class="overflow-y-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] absolute inset-0 flex-1 scroll-style"
        >
          <table class="table w-full transactions-table">
            <thead class="border-b dark:border-slate-800 border-slate-150">
              <tr class="text-slate-400 text-sm">
                <th class="text-left font-medium py-5 pl-7.5">Tx Hash</th>
                <th class="text-left font-medium py-5">Network</th>
                <th class="text-left font-medium py-5">Signer</th>
                <th class="text-left font-medium py-5">AvoSafe</th>
                <th class="text-left font-medium py-5">Status</th>
                <th class="text-left font-medium py-5">Fee</th>
                <th class="text-left font-medium py-5 pr-7.5">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
              <tr
                class="text-sm relative"
                v-for="transaction in transactions?.data"
              >
                <td>
                  <NuxtLink
                    :to="`/tx/${transaction.hash}`"
                    class="text-blue-500"
                  >
                    <span> {{ shortenHash(transaction.hash) }}</span>
                  </NuxtLink>
                </td>
                <td>
                  <div class="capitalize flex items-center">
                    <ChainLogo
                      class="w-5 h-5 mr-2.5"
                      :chain="transaction.chain_id"
                    />

                    <span>{{ chainIdToName(transaction.chain_id) }}</span>
                  </div>
                </td>
                <td>
                  <span v-if="transaction.metadata.signer">
                    {{ shortenHash(transaction.metadata.signer) }}</span
                  >
                </td>
                <td>
                  <span v-if="transaction.metadata.safe">
                    {{ shortenHash(transaction.metadata.safe) }}</span
                  >
                </td>
                <td>
                  <TransactionStatus :status="transaction.status" />
                </td>
                <td>
                  <span
                    v-if="transaction.fee"
                    class="dark:bg-slate-750 bg-slate-200 px-2.5 py-2 text-xs rounded-5"
                  >
                    {{ formatUsd(transaction.fee) }}</span
                  >
                </td>
                <td>
                  <span> {{ useTimeAgo(transaction.created_at).value }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <Pagination
      v-if="transactions?.total || 0 > limit"
      :url-prefix="$route.path"
      :total="transactions?.total || 0"
      :current="page"
      :limit="limit"
    />
  </div>
</template>

<style scoped>
.transactions-table > tbody > tr > td {
  @apply py-2;
}

.transactions-table > tbody > tr > td:first-child {
  @apply pl-7.5;
}

.transactions-table > tbody > tr > td:last-child {
  @apply pr-7.5;
}

.transactions-table > tbody > tr > td {
  @apply py-6;
}

.transactions-table > tbody > tr {
  transform-style: preserve-3d;
}

.transactions-table > tbody > tr:hover::after {
  content: "";
  transform: translateZ(-1px) translateX(-50%) translateY(-50%);
  @apply absolute top-1/2 left-1/2 dark:bg-slate-800 bg-slate-150 rounded-5;
  width: calc(100% - 20px);
  height: calc(100% - 16px);
}
</style>
