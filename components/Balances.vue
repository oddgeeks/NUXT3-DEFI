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

const priority = {
  1: 'ETH',
  137: 'MATIC',
  42161: 'ETH',
  10: 'ETH',
  43114: 'AVAX',
  56: 'BNB',
  100: 'XDAI'
};
const priorityStable = ['USDC', 'USDT', 'DAI', 'XDAI'];

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
  const withBalances = balances.filter((el: IBalance) => toBN(el.balance).decimalPlaces(5).gt(0));

  const priorityTokens = balances.filter((el: IBalance) => {
    if (toBN(el.balance).decimalPlaces(5).gt(0)) return false;
    if (el.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') return false;
    return Object.values(priority).includes(el.symbol.toUpperCase());
  });
  const orderedPriority = priorityTokens
    .sort((a: IBalance, b: IBalance) => Object.keys(priority).indexOf(a.chainId) - Object.keys(priority).indexOf(b.chainId));

  const nonPriority = balances.filter((el: IBalance) => !priorityTokens.includes(el) && !withBalances.includes(el));
  const stable: IBalance[] = nonPriority
    .filter((el: IBalance) => priorityStable.includes(el.symbol.toUpperCase()));

  const coins = new Map<string, IBalance[]>();
  for (const coin of stable) {
    const existing = coins.get(coin.chainId);
    if (existing) {
      coins.set(coin.chainId, [...existing, coin])
    } else {
      coins.set(coin.chainId, [coin])
    }
  }

  for (const coin of coins) {
    coins.set(coin[0], coin[1].sort((a: IBalance, b: IBalance) => priorityStable.indexOf(a.symbol.toUpperCase()) - priorityStable.indexOf(b.symbol.toUpperCase())));
  }

  const networks = [...props.networkPreference];
  const sortedCoins = new Map([...coins].sort((a, b) => networks.indexOf(parseInt(a[0])) - networks.indexOf(parseInt(b[0]))));
  const rest = balances.filter((el: IBalance) => !priorityTokens.includes(el) && !withBalances.includes(el) && !stable.includes(el));
  return [
    ...withBalances,
    ...orderedPriority,
    ...[...sortedCoins].flat(2).filter(el => typeof el !== 'string'),
    ...rest
  ];
});

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value;
}, 200);
</script>
<template>
  <div class="relative flex-1">
    <div class="h-full w-full flex flex-col gap-5">
      <CommonInput v-if="account" name="Token Search" @input="search" type="search" placeholder="Search">
        <template #prefix>
          <SearchSVG class="shrink-0 mr-2" />
        </template>
      </CommonInput>
      <div v-if="!!account && tokenBalances.length && filteredBalances.length === 0"
        class="dark:bg-gray-850 bg-slate-50 rounded-[25px] flex flex-col space-y-4 items-center py-32">
        <p class="text-slate-400">Nothing could be found</p>
        <div class="flex items-center flex-col space-y-4 sm:space-y-0 sm:flex-row sm:space-x-4">
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
        class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style"
        :class="{ '!overflow-hidden': !account }">
        <table class="table w-full" :class="{ 'blur pointer-events-none': !account }">
          <thead v-if="account">
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
      <div class="flex flex-col space-y-4 sm:hidden">
        <MobileBalanceRow v-for="tokenBalance in sortedBalances" :token-balance="tokenBalance"
          :key="`${tokenBalance.chainId}-${tokenBalance.symbol}`" />
      </div>
      <p class="text-xs leading-5 text-center mb-5 sm:mb-0 sm:text-right dark:text-slate-500 text-slate-400" v-if="account">
        Don’t see your tokens?
        <button @click="openImportTokenModal()" class="text-primary">
          Add token
        </button>
      </p>
    </div>
</div>
</template>
