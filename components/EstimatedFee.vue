<script lang="ts" setup>
import GasSVG from "~/assets/images/icons/gas.svg?component";

type Data = {
  fee: string;
  multiplier: string;
};

const minFee = {
  "137": 0.01,
  "10": 0.005,
  "42161": 0.005,
  "43114": 0.005,
  "1": 0.005,
  "100": 0.01,
  "56": 0.01,
};

const props = defineProps<{ data: Data; loading?: boolean; chainId: string }>();

const formattedFee = computed(() => {
  if (!props.data?.fee) return "0.00";

  const fee = props.data?.fee || "0";
  const multiplier = props.data?.multiplier || "0";

  const minValue = minFee[props.chainId as keyof typeof minFee];

  const maxVal = toBN(fee)
    .dividedBy(10 ** 18)
    .toFormat();

  const minVal = toBN(fee)
    .dividedBy(multiplier)
    .dividedBy(10 ** 14)
    .toFormat();

  if (toBN(maxVal).lt(minValue)) return formatDecimal(minValue, 2);

  return `${formatDecimal(minVal, 2)} - ${formatDecimal(maxVal, 2)}`;
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
    <span class="loading-box rounded-5 w-24 h-5" v-if="loading"></span>
    <span v-else class="text-xs">{{ formattedFee }} USDC</span>
  </div>
</template>
