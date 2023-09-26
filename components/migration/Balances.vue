<template>
  <div>
    <div class="p-5 flex items-center justify-between text-xs font-medium border-b-[1px] border-slate-750">
      <p class="text-white">Select tokens for migration</p>
      <button class="text-green-500" @click="selectAll">Select All</button>
    </div>

    <MigrationTokenBalance
      v-for="token in tokensWithBalances"
      :key="token.address + '-' + token.chainId"
      :token-balance="token"
      :is-checked="false"
    />
  </div>
</template>

<script setup lang="ts">
// import { useTokensStore } from '~/store/tokens';
// import { storeToRefs } from 'pinia';

// const runtimeConfig = useRuntimeConfig();
// const tokensStore = useTokensStore();
// const { toggleSelectedToken, setTokens } = tokensStore;
// const { selectedTokens } = storeToRefs(tokensStore);

const { tokenBalances } = useAvocadoSafe()

// const getBalance = (index: number) => {
//   if (!balances.value?.balances?.length) return 0;
//   const hexBalance = balances.value.balances[index].balance?._hex;
//   const decimals = tokenList.value?.tokens[index].decimals || 0;
//   return parseInt(hexBalance, 16) / Math.pow(10, decimals);
// }

const whitelistedSymbols = [
  'ETH',
  'USDC',
  'USDBC',
  'USDT',
  'DAI',
  'INST',
  'MATIC',
  'AVAX',
  'XDAI',
  'BNB',
  'OP',
  'GNO',
  'FUSE',
]

const tokensWithBalances = computed(() =>
  tokenBalances.value.filter((tb) => {
    return (
      toBN(tb.balance).gt(0)
      || whitelistedSymbols.includes(tb.symbol.toUpperCase())
    )
  }),
)

const selectAll = () => {
  // if (!tokenList.value?.tokens?.length) return;
  // setTokens(tokenList.value.tokens);
}

const getTokenId = (token: any) => {
  return ''
  // return `${token.address}-${token.chainId}`
}
 
const isChecked = (token: any) => {
  return true
  // const index = selectedTokens?.value?.findIndex((selectedToken) => getTokenId(selectedToken) === getTokenId(token))
  // return index > -1;
}
</script>