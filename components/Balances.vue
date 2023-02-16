<script setup lang="ts">
import SearchSVG from "~/assets/images/icons/search.svg?component";
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import { IBalance } from "~~/stores/safe";

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
  "OP",
  "GNO"
];

const priorityTokens = [
  { symbol: 'ETH', chainId: '1' },
  { symbol: 'MATIC', chainId: '137' },
  { symbol: 'ETH', chainId: '42161' },
  { symbol: 'OP', chainId: '10' },
  { symbol: 'AVAX', chainId: '43114' },
  { symbol: 'BNB', chainId: '56' },
  { symbol: 'GNO', chainId: '100' }
];

const priorityRest = ['USDC', 'USDT', 'DAI', 'XDAI', 'ETH', 'MATIC', 'BNB', 'OP', 'GNO', 'AVAX'];

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

const sortedBalances = computed(() => {
  const balances = filteredBalances.value;
  const priority = balances.filter((el: IBalance) => {
    if (el.balance !== '0') return false;
    return priorityTokens.some(p => p.chainId == el.chainId && p.symbol.toLowerCase() == el.symbol);
  });
  const non = balances.filter((el: IBalance) => el.balance === '0' && !priorityTokens.some(p => p.chainId == el.chainId && p.symbol.toLowerCase() == el.symbol));
  const orderedPriority = priority.sort((a: IBalance, b: IBalance) => {
    const aIdx = priorityTokens.findIndex(p => p.chainId === a.chainId && p.symbol.toLowerCase() === a.symbol);
    const bIdx = priorityTokens.findIndex(p => p.chainId === b.chainId && p.symbol.toLowerCase() === b.symbol);
    return aIdx - bIdx;
  });
  return [
    ...balances.filter((el: IBalance) => el.balance !== '0'),
    ...orderedPriority,
    ...non.sort((a: IBalance, b: IBalance) => priorityRest.indexOf(a.symbol.toUpperCase()) - priorityRest.indexOf(b.symbol.toUpperCase()))
  ];
});

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value;
}, 200);
</script>
<template>
  <div class="relative flex-1">
    <div class="h-full w-full flex flex-col gap-5">
      <CommonInput name="Token Search" @input="search" type="search" placeholder="Search">
        <template #prefix>
          <SearchSVG class="shrink-0 mr-2" />
        </template>
      </CommonInput>
      <div v-if="!!account && tokenBalances.length && filteredBalances.length === 0"
        class="dark:bg-gray-850 bg-slate-50 rounded-[25px] flex flex-col space-y-4 items-center py-32">
        <p class="text-slate-400">Nothing could be found</p>
        <div class="flex items-center space-x-4">
          <CommonButton color="white" size="lg" as="NuxtLink"
            href="mailto:info@instadapp.io?subject=Instadapp Avocado: New Token">
            Reach out to us
          </CommonButton>
          <CommonButton size="lg" @click="openImportTokenModal()" class="flex items-center space-x-2">
            <PlusSVG />
            <span>Custom token</span>
          </CommonButton>
        </div>
      </div>
      <div v-else style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] flex-1 scroll-style">
        <table class="table w-full">
          <thead>
            <tr class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800">
              <th class="text-left py-6 pl-7.5">Token</th>
              <th class="py-5">Balance</th>
              <th class="py-5 text-center">Last 7d</th>
              <th class="py-5 pl-10">Price</th>
            </tr>
          </thead>
          <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
            <template v-if="!account || !tokenBalances.length">
              <LoadingBalanceRow :loading="!!account && !tokenBalances.length" :key="i" v-for="i in 8" />
            </template>

            <template v-else>
              <BalanceRow v-for="tokenBalance in (searchQuery.length > 0 ? filteredBalances : sortedBalances)" :token-balance="tokenBalance"
                :key="`${tokenBalance.chainId}-${tokenBalance.symbol}`" />
            </template>
          </tbody>
        </table>
      </div>
      <p class="text-xs leading-5 text-right dark:text-slate-500 text-slate-400">
        Don’t see your tokens?
        <button @click="openImportTokenModal()" class="text-primary">
          Import token
        </button>
      </p>
    </div>
</div>
</template>
