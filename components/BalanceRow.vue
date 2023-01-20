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
  if (!props.tokenBalance.sparklinePrice7d.length) return null;
  let a = props.tokenBalance.sparklinePrice7d.at(-24)!;
  let b = props.tokenBalance.sparklinePrice7d.at(-1)!;
  return (100 * (b - a)) / a;
});

const priceDiffClass = computed(() => {
  if (!priceDiff.value) return "text-slate-400";

  if (priceDiff.value < 0) {
    return "text-[#EB5757]";
  }

  return "text-green-400";
});

const priceDiffColor = computed(() => {
  if (!priceDiff.value) return "rgb(148 163 184)";

  if (priceDiff.value < 0) {
    return "#EB5757";
  }

  return "rgb(74 222 128)";
});

const chartData = computed(() => ({
  labels: props.tokenBalance.sparklinePrice7d,
  datasets: [
    {
      data: props.tokenBalance.sparklinePrice7d,
      fill: false,
      pointRadius: 0,
      spanGaps: true,
      tension: 0.2,
    },
  ],
}));

const chartOptions = {
  events: [],
  borderColor: priceDiffColor.value,
  borderWidth: 1.5,
  responsive: true,
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
    <td class="text-left pl-7.5 py-6">
      <div class="flex items-center space-x-3">
        <div
          class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
        >
          <img
            :src="tokenBalance.logoURI"
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
            class="text-lg font-semibold whitespace-nowrap pr-2 md:w-32 truncate"
          >
            {{ tokenBalance.name }}
          </div>
          <div
            class="text-sm font-medium text-slate-400 max-w-[256px] uppercase"
          >
            {{ toBN(tokenBalance.balance).toFormat(6) }}
            {{ tokenBalance.symbol }}
          </div>
        </div>
      </div>
    </td>
    <td  class="text-center font-semibold py-6 whitespace-nowrap">
      <span v-if="tokenBalance.balanceInUSD">
        {{ formatUsd(tokenBalance.balanceInUSD) }}
      </span>

      <span v-else> - </span>
    </td>
    <td class="text-center font-semibold px-10 py-6">
      <div class="w-20 h-8 mx-auto">
        <Line
          v-if="tokenBalance.sparklinePrice7d.length"
          :data="chartData"
          :options="chartOptions"
        />
        <span v-else> - </span>
      </div>
    </td>
    <td class="text-center font-semibold py-6">
      <span v-if="priceDiff" :class="priceDiffClass">
        {{ priceDiff.toFixed(2) }}%
      </span>

      <span v-else> - </span>
    </td>
    <td class="text-right pl-7.5 py-6">
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
