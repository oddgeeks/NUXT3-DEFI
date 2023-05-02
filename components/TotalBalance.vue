<script setup>
import { storeToRefs } from 'pinia'

const { balances } = storeToRefs(useSafe())
const { totalBalance, account } = useAvocadoSafe()
</script>

<template>
  <div>
    <h2 class="text-slate-400 text-sm font-semibold mb-2.5">
      Total balancee
    </h2>
    <div class="font-semibold text-[40px] leading-10">
      <div v-if="!balances.data" class="h-10 w-40 flex items-center">
        <div class="loading-box rounded-[12px] w-full h-[34px]" />
      </div>
      <div v-else>
        {{ formatUsd(totalBalance.toNumber()) }}
      </div>
    </div>
  </div>
</template>
