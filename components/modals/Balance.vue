<script setup lang="ts">
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import BridgeSVG from '~/assets/images/icons/bridge.svg?component'
import RefreshSVG from '~/assets/images/icons/refresh.svg?component'
import type { IBalance } from '~/stores/safe'

const props = defineProps({
  balance: {
    type: Object,
    required: true,
  },
})

const balance = computed(() => props.balance as IBalance)
const liteAPY = ref('')

const {
  priceDiffColor,
  interactable,
  priceDiffClass,
  priceDiffInPercent,
  isSwapDisabled,
  fetchLiteAPY,
  isBridgeDisabled,
} = useGraph(balance)

onMounted(async () => {
  const apy = await fetchLiteAPY(balance.value)

  if (apy)
    liteAPY.value = apy
})
</script>

<template>
  <div class="flex flex-col items-center gap-7.5">
    <div class="flex flex-col items-center gap-5">
      <SafeTokenLogo class="h-[60px] w-[60px]" :chain-id="balance.chainId" :url="balance.logoURI" />

      <div class="flex flex-col items-center gap-3">
        <NuxtLink v-if="liteAPY" external target="_blank" to="https://lite.instadapp.io" class="inline-flex items-center justify-center  rounded-5 bg-lite bg-opacity-10 px-2 py-1 text-[10px] font-medium leading-[10px] text-lite">
          Earn  {{ formatPercent(liteAPY) }} APY
        </NuxtLink>

        <span class="text-[26px] leading-[25px]">
          {{ formatDecimal(balance.balance) }}
          {{ balance.symbol.toUpperCase() }}
        </span>

        <span class="text-sm leading-5 text-slate-400">
          {{ formatUsd(balance.balanceInUSD).replace("$", "$ ") }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-center gap-[55px]">
      <div class="flex flex-col items-center gap-2">
        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Send',
          }"
          :disabled="!interactable"
          class="!h-[46px] !w-[45px] items-center justify-center rounded-full !p-0"
          @click="openSendModal(balance.chainId, balance.address)"
        >
          <ArrowRight class="-rotate-45" />
        </CommonButton>
        <span class="text-sm text-slate-400">Send</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Swap',
          }"
          :disabled="!interactable || isSwapDisabled"
          class="!h-[46px] !w-[45px] items-center justify-center rounded-full !p-0"
          @click="openSwapModal(balance.address, balance.chainId)"
        >
          <RefreshSVG />
        </CommonButton>
        <span class="text-sm text-slate-400">Swap</span>
      </div>

      <div class="flex flex-col items-center gap-2">
        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Bridge',
          }"
          :disabled="!interactable || isBridgeDisabled"
          class="!h-[46px] !w-[45px] items-center justify-center rounded-full !p-0"
          @click="openBridgeModal(balance.address, balance.chainId)"
        >
          <BridgeSVG />
        </CommonButton>
        <span class="text-sm text-slate-400">Bridge</span>
      </div>
    </div>

    <div
      class="relative flex h-[232px] w-full justify-between rounded-[20px] bg-gray-850"
    >
      <div class="flex flex-col gap-2.5 pl-5 pt-5">
        <span class="text-xl leading-5">{{ formatUsd(balance.price) }}</span>
        <span class="text-sm leading-5" :class="priceDiffClass">
          {{ signedNumber(toBN(priceDiffInPercent).toFixed(2)) }}%
        </span>
      </div>
      <span class="pr-5 pt-5 text-slate-400">Last 7d</span>
      <div class="absolute bottom-5 h-[122px] w-full">
        <SparklineChart v-if="balance.sparklinePrice7d.length" v-once :line-color="priceDiffColor" :sparkline-data="balance.sparklinePrice7d" />
        <span v-else> - </span>
      </div>
    </div>
  </div>
</template>
