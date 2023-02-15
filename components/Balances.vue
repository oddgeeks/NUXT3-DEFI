<script setup lang="ts">
import SearchSVG from "~/assets/images/icons/search.svg?component";

const { tokenBalances } = useAvocadoSafe();
const { account } = useWeb3();
const { networks } = useNetworks();

const availableNetworks = networks.filter((network) => network.chainId != 634);

const whitelistedSymbols = [
  "ETH",
  "USDC",
  "USDT",
  "DAI",
  "MATIC",
  "AVAX",
  "XDAI",
  "BNB",
  "STETH",
  "WSTETH"
];

const tokensWithBalances = computed(() =>
  tokenBalances.value.filter((tb) => {
    return (
      toBN(tb.balance).gt(0) ||
      whitelistedSymbols.includes(tb.symbol.toUpperCase())
    );
  })
);

const searchQuery = ref("");

const props = defineProps({
  hideZeroBalances: {
    type: Boolean,
    default: false,
  },
  networkPreference: {
    type: Set<Number>,
    default: new Set(),
  },
});

const filteredBalances = computed(() => {
  let tokens = tokenBalances.value;

  if (!searchQuery.value || searchQuery.value.trim().length === 0) {
    tokens = tokensWithBalances.value;
  }

  const filters = {
    name: (name: string, token: any) =>
      !!searchQuery.value
        ? name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.value.toLowerCase())
        : true,
    balance: (balance: any) =>
      props.hideZeroBalances ? toBN(balance).decimalPlaces(5).gt(0) : true,
    chainId: (chainId: string) =>
      props.networkPreference.size === availableNetworks.length
        ? true
        : props.networkPreference.has(parseInt(chainId)),
  };

  return filterArray(tokens, filters);
});

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value;
}, 200);
</script>
<template>
  <div class="relative flex-1">
    <div class="h-full w-full flex flex-col gap-5">
      <CommonInput
        name="Token Search"
        @input="search"
        type="search"
        placeholder="Search"
      >
        <template #prefix>
          <SearchSVG class="shrink-0 mr-2" />
        </template>
      </CommonInput>
      <div v-if="!!account && tokenBalances.length && filteredBalances.length === 0" class="dark:bg-gray-850 bg-slate-50 rounded-[25px] flex flex-col space-y-4 items-center py-32">
        <p class="text-slate-400">Nothing could be found</p>
        <CommonButton color="white" size="lg" as="NuxtLink" href="mailto:info@instadapp.io?subject=Instadapp Avocado: New Token">
          Reach out to us
        </CommonButton>
      </div>
      <div
        v-else
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] flex-1 scroll-style"
      >
        <table class="table w-full">
          <thead>
            <tr
              class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
            >
              <th class="text-left py-6 pl-7.5">Token</th>
              <th class="py-5">Balance</th>
              <th class="py-5 text-center">Last 7d</th>
              <th class="py-5 pl-10">Price</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
            <template v-if="!account || !tokenBalances.length">
              <LoadingBalanceRow
                :loading="!!account && !tokenBalances.length"
                :key="i"
                v-for="i in 8"
              />
            </template>

            <template v-else>
              <BalanceRow
                v-for="tokenBalance in filteredBalances"
                :token-balance="tokenBalance"
                :key="`${tokenBalance.chainId}-${tokenBalance.symbol}`"
              />
            </template>
          </tbody>
        </table>
      </div>
      <p
        class="text-xs leading-5 text-right dark:text-slate-500 text-slate-400"
      >
        Don’t see your tokens?
        <button @click="openImportTokenModal()" class="text-primary">
          Import token
        </button>
      </p>
    </div>
  </div>
</template>
