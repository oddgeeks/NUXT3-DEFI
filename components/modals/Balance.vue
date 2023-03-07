<script setup lang="ts">
import { Line } from "vue-chartjs";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import BridgeSVG from "~/assets/images/icons/bridge.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";

const props = defineProps({
  balance: {
    type: Object,
    required: true
  }
});

const interactable = computed(() =>
  toBN(props.balance.balance).decimalPlaces(5).gt(0)
);

const priceDiffColor = computed(() => {
  if (!priceDiffInPercent.value) return "rgb(148 163 184)";

  if (priceDiffInPercent.value < 0) {
    return "#EB5757";
  }

  return "#16A34A";
});

const priceDiffInPercent = computed(() => {
  if (!props.balance.sparklinePrice7d.length) return 0;
  let a = props.balance.sparklinePrice7d.at(-24)!;
  let b = props.balance.sparklinePrice7d.at(-1)!;
  return (100 * (b - a)) / a;
});

const priceDiffClass = computed(() => {
  if (!priceDiffInPercent.value) return "text-slate-400";

  if (priceDiffInPercent.value < 0) {
    return "text-red-alert";
  }

  return "text-primary";
});

const chartData = computed(() => ({
  labels: props.balance.sparklinePrice7d,
  datasets: [
    {
      data: props.balance.sparklinePrice7d,
      fill: false,
      pointRadius: 0,
      cubicInterpolationMode: "monotone",
    },
  ],
}));

const chartOptions = {
  events: [],
  borderColor: priceDiffColor.value,
  borderWidth: 3,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltips: {
      display: false,
    },
  },
  scales: {
    x: {
      display: false,
    },
    y: {
      display: false,
    },
  },
};
</script>

<template>
  <div class="flex flex-col items-center gap-7.5">
    <div class="flex flex-col items-center gap-5">
      <div class="relative inline-block h-[60px] w-[60px] rounded-full flex-shrink-0">
        <img :src="balance.logoURI" class="h-[60px] w-[60px] rounded-full" :onerror="onImageError" />

        <ChainLogo :stroke="true" class="w-[30px] h-[30px] absolute -left-1 -bottom-1" :chain="balance.chainId" />
      </div>

      <div class="flex flex-col items-center gap-3">
        <span class="text-[26px] leading-[25px]">
          {{
            toBN(balance.balance)
              .decimalPlaces(5)
              .toFormat()
          }}
          {{ balance.symbol.toUpperCase() }}
        </span>

        <span class="text-sm text-slate-400 leading-5">
          {{ formatUsd(balance.balanceInUSD).replace('$', '$ ') }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-[55px] justify-center">
      <div class="flex flex-col items-center gap-2">
        <CommonButton v-tippy="{
          arrow: true,
          arrowType: 'round',
          animation: 'fade',
          content: 'Send',
        }" :disabled="!interactable" class="!h-[46px] !w-[45px] rounded-full !p-0 items-center justify-center"
          @click="openSendModal(balance.address, balance.chainId)">
          <ArrowRight class="-rotate-45" />
        </CommonButton>
        <span class="text-slate-400 text-sm">Send</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <CommonButton v-tippy="{
          arrow: true,
          arrowType: 'round',
          animation: 'fade',
          content: 'Swap',
        }" :disabled="!interactable" class="!h-[46px] !w-[45px] rounded-full !p-0 items-center justify-center"
          @click="openBridgeModal(balance.address, balance.chainId)">
          <RefreshSVG />
        </CommonButton>
        <span class="text-slate-400 text-sm">Bridge</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <CommonButton v-tippy="{
          arrow: true,
          arrowType: 'round',
          animation: 'fade',
          content: 'Bridge',
        }" :disabled="!interactable" class="!h-[46px] !w-[45px] rounded-full !p-0 items-center justify-center"
          @click="openSwapModal(balance.address, balance.chainId)">
          <BridgeSVG />
        </CommonButton>
        <span class="text-slate-400 text-sm">Swap</span>
      </div>
    </div>

    <div class="bg-gray-850 relative flex justify-between w-full h-[232px] rounded-[20px]">
      <div class="flex flex-col gap-2.5 pl-5 pt-5">
        <span class="text-xl leading-5">{{ formatUsd(balance.price) }}</span>
        <span class="text-sm leading-5" :class="priceDiffClass"> {{ signedNumber(toBN(priceDiffInPercent).toFixed(2)) }}%
        </span>
      </div>
      <span class="pt-5 pr-5 text-slate-400">Last 7d</span>
      <div class="absolute bottom-5 h-[122px] w-full">
        <Line v-if="balance.sparklinePrice7d.length" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>