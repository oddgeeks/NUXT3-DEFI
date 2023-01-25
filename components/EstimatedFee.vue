<script lang="ts" setup>
import GasSVG from "~/assets/images/icons/gas.svg?component";

type Data = {
  fee: string;
  multiplier: string;
};

const props = defineProps<{ data: Data, loading?: boolean }>();

const amontInUSD = computed(() => {
  return toBN(props.data?.fee || "0").dividedBy(10 ** 18).toFormat()
});
</script>

<template>
  <div class="flex items-center justify-between">
    <span
      class="text-xs text-slate-400 font-medium gap-2 inline-flex items-center"
    >
      <GasSVG class="w-4" />
      Estimated transaction fees
    </span>
    <span class="loading-box rounded-5 w-12 h-5" v-if="loading"></span>
    <span v-else class="text-xs">{{ formatUsd(amontInUSD) }}</span>
  </div>
</template>
