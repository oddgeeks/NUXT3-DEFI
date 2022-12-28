<script setup>
const { totalBalance } = useAvocadoSafe();
</script>
<template>
    <div>
        <h2 class="text-slate-400 text-sm font-semibold mb-2.5">Total balance</h2>
        <div class="font-semibold text-[40px] leading-10">$ {{ totalBalance.toFormat(2) }}</div>
    </div>
</template>