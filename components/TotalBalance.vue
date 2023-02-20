<script setup>
const { totalBalance, tokenBalances,account } = useAvocadoSafe();
const tokenStore = useTokens();
</script>
<template>
    <div   :class="{ 'blur pointer-events-none': !account }">
        <h2 class="text-slate-400 text-sm font-semibold mb-2.5">Total balance</h2>
        <div class="font-semibold text-[40px] leading-10">
            <span v-if="tokenBalances.length > 0 && tokenBalances.length > tokenStore.tokens.length / 2">
                $ {{ totalBalance.toFormat(2) }}
            </span>
            <div v-else class="loading-box rounded-5 w-40 h-8 my-2"></div>
        </div>
    </div>
</template>