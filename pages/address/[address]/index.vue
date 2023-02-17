<script setup lang="ts">
import type { Ref } from "vue";
type ITransactionResponse = {
  data: IAvocadoTransaction[];
  page: number;
  total: number;
};

const router = useRoute();
const provider = getRpcProvider(634);

const limit = 20;
const page = computed(() => parseInt(String(router.query.page)) || 1) as Ref<number>;

const defaultTransactions: ITransactionResponse = {
  data: [],
  page: 1,
  total: 0,
};

const headers = [
  "Tx Hash",
  "Network",
  "Signer",
  "Avocado Wallet",
  "Status",
  "Fee",
  "Timestamp",
]

const { data: transactions, refresh } = useAsyncData(
  "transactions",
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
    immediate: true,
  }
);

const { pause } = useIntervalFn(refresh, 5000)

onUnmounted(() => {
  pause();
});
</script>

<template>
  <div class="container flex flex-col gap-5 flex-1 md:pb-10">
    <h1>Transactions</h1>

    <div class="relative flex-1">
      <div class="overflow-hidden">
        <div
          class="overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-5.5 flex-1 scroll-style relative"
        >
          <h1 v-if="!transactions?.data.length" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl">No Transactions</h1>
          <table :class="{'blur relative pointer-events-none': !transactions?.data.length}" class="table w-full">
            <thead class="border-b dark:border-slate-800 border-slate-150">
              <tr class="text-slate-400 text-sm">
                <th :key="header" v-for="header in headers" class="text-left whitespace-nowrap font-medium py-5 md:pl-0 pl-4 first:pl-7.5">
                {{ header }}
                </th>
              </tr>
            </thead>
            <tfoot v-if="transactions?.total || 0 > limit" class="border-t dark:border-slate-800 border-slate-150">
              <tr>
                <td :colspan="headers.length">
                  <Pagination
                  :url-prefix="$route.path"
                  :total="transactions?.total || 0"
                  :current="page"
                  :limit="limit"
                  />
                </td>
              </tr>
            </tfoot>
            <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
              <template v-if="!transactions?.data.length">
                <LoadingTransactionRow v-for="i in 7" :key="i" />
              </template>

              <template v-else >
                <TransactionRow :transaction="transaction" :key="transaction.id" v-for="transaction in transactions?.data"/>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>