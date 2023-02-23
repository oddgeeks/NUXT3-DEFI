<script setup>
import { storeToRefs } from "pinia";

const { apiBalances } = storeToRefs(useSafe());
const { totalBalance, account } = useAvocadoSafe();
</script>
<template>
  <div :class="{ 'blur pointer-events-none': !account }">
    <h2 class="text-slate-400 text-sm font-semibold mb-2.5">Total balance</h2>
    <div class="font-semibold text-[40px] leading-10">
      <div v-if="!apiBalances" class="h-10 w-40 flex items-center">
        <div class="loading-box rounded-5 w-full h-8"></div>
      </div>
      <div v-else>{{ formatUsd(totalBalance.toNumber()) }}</div>
    </div>
  </div>
</template>
