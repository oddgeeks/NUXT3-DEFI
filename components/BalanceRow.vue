<script lang="ts" setup>
import type { IBalance } from '~/stores/safe'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import BridgeSVG from '~/assets/images/icons/bridge.svg?component'
import RefreshSVG from '~/assets/images/icons/refresh.svg?component'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'

const props = defineProps<{
  tokenBalance: IBalance
  summary?: boolean
  sum?: number
  sumInUsd?: number
  hide?: boolean
  collapse?: boolean
  onToggle?: Function
  count?: number
}>()

const balance = computed(() => props.tokenBalance as IBalance)
const liteAPY = ref('')

const {
  priceDiffColor,
  interactable,
  temporaryDisabled,
  priceDiffClass,
  priceDiffInPercent,
  fetchLiteAPY,
  nonAuthorised,
} = useGraph(balance)

onMounted(async () => {
  const apy = await fetchLiteAPY(props.tokenBalance)

  if (apy)
    liteAPY.value = apy
})

function onClick() {
  if (props.summary && props.onToggle)
    props.onToggle()
}
</script>

<template>
  <tr :class="`${summary ? 'hover:cursor-pointer' : ''}`" @click="onClick">
    <td class="text-left py-6 pl-7.5 w-1/3">
      <div :class="`flex space-x-3 ${summary || (!summary && !hide) ? 'items-center' : 'pl-2'}`">
        <SafeTokenLogo v-if="!summary && !hide" :chain-id="tokenBalance.chainId" :url="tokenBalance.logoURI" />
        <SafeTokenLogo v-if="summary" :url="tokenBalance.logoURI" :count="count" />
        <div v-if="hide" class="w-10 h-10 relative">
          <ChainLogo
            v-tippy="chainIdToName(tokenBalance.chainId)"
            :stroke="true"
            class="w-5.5 h-5.5 absolute right-0 top-0"
            :chain="tokenBalance.chainId"
          />
        </div>

        <div class="max-w-[320px] w-full">
          <div class="flex items-center gap-1.5">
            <span
              v-if="tokenBalance.name.length > 15"
              v-tippy="tokenBalance.name"
            >
              {{ tokenBalance.name }}

            </span>

            <span v-else>
              {{ tokenBalance.name }}
            </span>
            <NuxtLink v-if="liteAPY" external target="_blank" to="https://lite.instadapp.io" class="bg-lite font-medium text-lite  text-[10px] leading-[10px] inline-flex items-center justify-center bg-opacity-10 px-2 py-1 rounded-5">
              Earn  {{ formatPercent(liteAPY) }} APY
            </NuxtLink>
          </div>
          <span
            v-if="!summary"
            v-tippy="`${toBN(tokenBalance.balance).toFormat()} ${tokenBalance.symbol?.toUpperCase()}`"
            class="text-sm font-medium text-slate-400 max-w-[256px] uppercase"
          >
            {{
              formatDecimal(tokenBalance.balance)
            }}
            {{ tokenBalance.symbol }}
          </span>
          <span
            v-else
            v-tippy="`${sum} ${tokenBalance.symbol?.toUpperCase()}`"
            class="text-sm font-medium text-slate-400 max-w-[256px] uppercase"
          >
            {{
              formatDecimal(sum)
            }}
            {{ tokenBalance.symbol }}
          </span>
        </div>
      </div>
    </td>
    <td class="font-semibold py-6 whitespace-nowrap">
      <div v-if="!summary">
        <span v-if="tokenBalance.balanceInUSD">
          {{ formatUsd(tokenBalance.balanceInUSD) }}
        </span>

        <span v-else> - </span>
      </div>
      <span v-else>
        {{ formatUsd(sumInUsd) }}
      </span>
    </td>
    <td class="text-center font-semibold py-6 px-6">
      <div v-if="!hide" class="h-8 w-36 mx-auto">
        <SparklineChart v-if="tokenBalance.sparklinePrice7d.length" v-once :line-color="priceDiffColor" :sparkline-data="tokenBalance.sparklinePrice7d" />
        <span v-else> - </span>
      </div>
    </td>
    <td class="font-semibold py-6 text-sm pl-10">
      <div v-if="!hide">
        <div v-if="priceDiffInPercent" class="flex gap-1 flex-col">
          <span>
            {{ formatUsd(toBN(tokenBalance.price || "0").decimalPlaces(2)) }}
          </span>
          <span :class="priceDiffClass">
            {{ signedNumber(toBN(priceDiffInPercent).toFixed(2)) }}%
          </span>
        </div>
        <span v-else-if="tokenBalance.price">
          {{ formatUsd(toBN(tokenBalance.price || "0").decimalPlaces(2)) }}
        </span>
        <span v-else> - </span>
      </div>
    </td>
    <td class="text-right py-6 min-w-[138px]">
      <div
        v-if="!summary" v-tippy="{
          content: nonAuthorised ? `You are not authorized to interact with tokens on ${chainIdToName(balance.chainId)}` : undefined,
        }" class="flex items-center gap-[15px] justify-center"
      >
        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Send',
          }"
          :disabled="!interactable"
          class="!h-9 !w-9 !p-0 items-center justify-center"
          @click="openSendModal(tokenBalance.chainId, tokenBalance.address)"
        >
          <ArrowRight class="-rotate-45" />
        </CommonButton>

        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Swap',
          }"
          :disabled="!interactable || temporaryDisabled"
          class="!h-9 !w-9 !p-0 items-center justify-center"
          @click="openSwapModal(tokenBalance.address, tokenBalance.chainId)"
        >
          <RefreshSVG />
        </CommonButton>

        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Bridge',
          }"
          :disabled="!interactable"
          class="!h-9 !w-9 !p-0 items-center justify-center"
          @click="openBridgeModal(tokenBalance.address, tokenBalance.chainId)"
        >
          <BridgeSVG />
        </CommonButton>
      </div>
      <div v-else class="flex justify-end pr-[30px]">
        <ChevronDownSVG v-if="!collapse" class="text-slate-400 w-[14px] h-[14px]" />
        <ChevronDownSVG v-else class="text-slate-400 w-[14px] h-[14px] rotate-180" />
      </div>
    </td>
  </tr>
</template>
