<script setup lang="ts">
import { Line } from "vue-chartjs";
import { IBalance } from "~/stores/safe";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import BridgeSVG from "~/assets/images/icons/bridge.svg?component";
import RefreshSVG from "~/assets/images/icons/refresh.svg?component";

const props = defineProps<{
  tokenBalance: IBalance;
}>();

const priceDiff = computed(() => {
  if (!props.tokenBalance.sparklinePrice7d.length) return 0;
  let a = props.tokenBalance.sparklinePrice7d.at(-24)!;
  let b = props.tokenBalance.sparklinePrice7d.at(-1)!;
  return b - a;
});

const priceDiffInPercent = computed(() => {
  if (!props.tokenBalance.sparklinePrice7d.length) return 0;
  let a = props.tokenBalance.sparklinePrice7d.at(-24)!;
  let b = props.tokenBalance.sparklinePrice7d.at(-1)!;
  return (100 * (b - a)) / a;
});

const priceDiffClass = computed(() => {
  if (!priceDiffInPercent.value) return "text-slate-400";

  if (priceDiffInPercent.value < 0) {
    return "text-red-alert";
  }

  return "text-primary";
});

const priceDiffColor = computed(() => {
  if (!priceDiffInPercent.value) return "rgb(148 163 184)";

  if (priceDiffInPercent.value < 0) {
    return "#EB5757";
  }

  return "#89BA4F";
});

const chartData = computed(() => ({
  labels: props.tokenBalance.sparklinePrice7d,
  datasets: [
    {
      data: props.tokenBalance.sparklinePrice7d,
      fill: false,
      pointRadius: 0,
      cubicInterpolationMode: "monotone",
    },
  ],
}));

const chartOptions = {
  events: [],
  borderColor: priceDiffColor.value,
  borderWidth: 1.5,
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
  <tr>
    <td class="text-left py-6 pl-7.5 w-1/3">
      <div class="flex items-center space-x-3">
        <div
          class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
        >
          <img
            :src="tokenBalance.logoURI"
            class="h-10 w-10 rounded-full"
            onerror="this.onerror=null; this.remove();"
          />

          <ChainLogo
            :stroke="true"
            class="w-5.5 h-5.5 absolute -left-1 -bottom-1"
            :chain="tokenBalance.chainId"
          />
        </div>

        <div>
          <div
            class="text-lg font-semibold whitespace-nowrap truncate"
          >
            {{ tokenBalance.name }}
          </div>
          <div
            class="text-sm font-medium text-slate-400 max-w-[256px] uppercase"
          >
            {{ toBN(tokenBalance.balance).decimalPlaces(4).toFormat() }}
            {{ tokenBalance.symbol }}
          </div>
        </div>
      </div>
    </td>
    <td class="font-semibold py-6 whitespace-nowrap">
      <span v-if="tokenBalance.balanceInUSD">
        {{ formatUsd(tokenBalance.balanceInUSD) }}
      </span>

      <span v-else> - </span>
    </td>
    <td class="text-center font-semibold py-6 px-6">
      <div class="w-20 h-8 mx-auto">
        <Line
          v-if="tokenBalance.sparklinePrice7d.length"
          :data="chartData"
          :options="chartOptions"
        />
        <span v-else> - </span>
      </div>
    </td>
    <td class="font-semibold py-6 text-sm pl-10">
      <div
        class="flex gap-1 flex-col"
        v-if="priceDiffInPercent"
      >
        <span> {{ priceDiffInPercent.toFixed(2) }}% </span>
        <span :class="priceDiffClass">
          {{ formatUsd(toBN(priceDiff).decimalPlaces(3)) }}
        </span>
      </div>
      <span v-else> - </span>
    </td>
    <td class="text-right py-6">
      <div class="flex items-center gap-[15px] justify-center">
        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Send',
          }"
          :disabled="isZero(tokenBalance.balance)"
          class="!h-9 !w-9 !p-0 items-center justify-center"
          @click="openSendModal(tokenBalance.address, tokenBalance.chainId)"
        >
          <ArrowRight class="-rotate-45" />
        </CommonButton>

        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Bridge',
          }"
          :disabled="isZero(tokenBalance.balance)"
          class="!h-9 !w-9 !p-0 items-center justify-center"
          @click="openBridgeModal(tokenBalance.address, tokenBalance.chainId)"
        >
          <BridgeSVG />
        </CommonButton>

        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Swap',
          }"
          :disabled="isZero(tokenBalance.balance)"
          class="!h-9 !w-9 !p-0 items-center justify-center"
          @click="openSwapModal(tokenBalance.address, tokenBalance.chainId)"
        >
          <RefreshSVG />
        </CommonButton>
      </div>
    </td>
  </tr>
</template>
