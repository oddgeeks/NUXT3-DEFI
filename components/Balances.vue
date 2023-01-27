<script setup lang="ts">
import SearchSVG from "~/assets/images/icons/search.svg?component";

const { tokenBalances } = useAvocadoSafe();
const { account } = useWeb3();

const whitelistedSymbols = ["ETH", "USDC", "USDT", "DAI", "MATIC", "AVAX", "XDAI", "BNB"];

const tokensWithBalances = computed(() => tokenBalances.value.filter(tb => {
  return toBN(tb.balance).gt(0) || whitelistedSymbols.includes(tb.symbol.toUpperCase())
}))

const searchQuery = ref('')

const props = defineProps({
  hideZeroBalances: {
    type: Boolean,
    default: false
  },
  networkPreference: {
    type: String,
    default: 'all'
  }
})

const filteredBalances = computed(() => {
  let tokens = tokenBalances.value;

  if (!searchQuery.value || searchQuery.value.trim().length === 0) {
    tokens = tokensWithBalances.value
  }


  const filters = {
    name: (name: string, token: any) =>
      !!searchQuery.value ? name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.value.toLowerCase()) : true,
    balance: (balance: any) => props.hideZeroBalances ? !isZero(balance) : true,
    chainId: (chainId: string) => props.networkPreference === 'all' ? true : chainId == props.networkPreference
  }

  return filterArray(tokens, filters)
})

</script>
<template>
  <div class="relative flex-1">
    <div class="dark:bg-gray-850 bg-slate-50 rounded-[25px] h-full w-full">
      <div
        style="scrollbar-gutter: stable; overflow-y: overlay"
        class="overflow-y-auto overflow-x-auto rounded-[inherit] md:overflow-x-hidden min-h-full max-h-[530px] flex-1 scroll-style"
        :class="{ blur: !account }">
        <table class="table w-full">
          <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
            <tr class="border-b-0 dark:divide-slate-800 divide-slate-150">
              <td colspan="5" class="text-left pl-7.5 pr-5 py-6 sticky top-0 mt-1 dark:bg-gray-850 bg-slate-50 z-10">
                <CommonInput name="Token Search" v-model="searchQuery" type="search" placeholder="Search">
                  <template #prefix>
                    <SearchSVG class="shrink-0 mr-2" />
                  </template>
                </CommonInput>
              </td>
            </tr>

            <template v-if="!account || !tokenBalances.length">
              <LoadingBalanceRow :loading="!!account && !tokenBalances.length" :key="i" v-for="i in 8" />
            </template>

            <template v-else>
              <BalanceRow v-for="tokenBalance in filteredBalances" :token-balance="tokenBalance"
                :key="`${tokenBalance.chainId}-${tokenBalance.symbol}`" />
            </template>


          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!account" class="absolute inset-0 flex items-center justify-center">
      <div class="flex flex-col items-center justify-center gap-6">
        <p class="font-semibold text-lg">
          Connect your wallet to see the balances
        </p>

        <div class="w-28">
          <Web3Button />
        </div>
      </div>
    </div>
  </div>
</template>
