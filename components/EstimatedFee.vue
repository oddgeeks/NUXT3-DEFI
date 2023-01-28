<script lang="ts" setup>
import GasSVG from "~/assets/images/icons/gas.svg?component";

type Data = {
  fee: string;
  multiplier: string;
};

const props = defineProps<{ data: Data; loading?: boolean; chainId: string }>();

const formattedFee = computed(() =>
  calculateEstimatedFee({ chanId: props.chainId, ...props.data })
);
</script>

<template>
  <div class="flex items-center justify-between">
    <span
      class="text-xs text-slate-400 font-medium gap-2 inline-flex items-center"
    >
      <GasSVG class="w-4" />
      Estimated transaction fees
    </span>
    <span class="loading-box rounded-5 w-24 h-5" v-if="loading"></span>
    <span v-else class="text-xs">{{ formattedFee }} USDC</span>
  </div>
</template>
