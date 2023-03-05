<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import GasSVG from "~/assets/images/icons/gas.svg?component";

const { gasBalance } = storeToRefs(useSafe());
</script>

<template>
  <button class="px-4 py-[9px] flex items-center justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2"
    @click="openTopUpGasModal()">
    <GasSVG class="text-slate-400" />

    <span v-if="gasBalance" class="whitespace-nowrap leading-5">
      {{ formatDecimal(gasBalance, 2) }} USDC</span>

    <div v-else class="loading-box rounded-5 w-20 h-5"></div>

    <span class="h-[26px] w-[26px] flex items-center justify-center bg-primary rounded-full text-white">
      <PlusSVG />
    </span>
  </button>
</template>