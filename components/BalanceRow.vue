<script lang="ts" setup>
import { Tippy } from 'vue-tippy'
import type { IBalance } from '~/stores/safe'
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
  isBridgeDisabled,
  isSwapDisabled,
  priceDiffClass,
  priceDiffInPercent,
  fetchLiteAPY,
  nonAuthorised,
  fuseDisabled,
} = useGraph(balance)

const errorMessage = computed(() => {
  if (nonAuthorised.value)
    return `You are not authorized to interact with tokens on ${chainIdToName(balance.value.chainId)}`

  if (fuseDisabled.value)
    return 'Fuse network is not supported legacy safes'
})

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
    <td class="w-1/3 py-6 pl-7.5 text-left">
      <div :class="`flex space-x-3 ${summary || (!summary && !hide) ? 'items-center' : 'pl-2'}`">
        <SafeTokenLogo v-if="!summary && !hide" :chain-id="tokenBalance.chainId" :url="tokenBalance.logoURI" />
        <SafeTokenLogo v-if="summary" :url="tokenBalance.logoURI" :count="count" />
        <div v-if="hide" class="relative h-10 w-10">
          <ChainLogo
            v-tippy="chainIdToName(tokenBalance.chainId)"
            :stroke="true"
            class="absolute right-0 top-0 h-5.5 w-5.5"
            :chain="tokenBalance.chainId"
          />
        </div>

        <div class="w-full max-w-[320px]">
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
            <NuxtLink v-if="liteAPY" external target="_blank" to="https://lite.instadapp.io" class="inline-flex items-center justify-center  rounded-5 bg-lite bg-opacity-10 px-2 py-1 text-[10px] font-medium leading-[10px] text-lite">
              Earn  {{ formatPercent(liteAPY) }} APY
            </NuxtLink>
          </div>
          <span
            v-if="!summary"
            v-tippy="`${toBN(tokenBalance.balance).toFormat()} ${tokenBalance.symbol?.toUpperCase()}`"
            class="max-w-[256px] text-sm font-medium uppercase text-slate-400"
          >
            {{
              formatDecimal(tokenBalance.balance)
            }}
            {{ tokenBalance.symbol }}
          </span>
          <span
            v-else
            v-tippy="`${sum} ${tokenBalance.symbol?.toUpperCase()}`"
            class="max-w-[256px] text-sm font-medium uppercase text-slate-400"
          >
            {{ formatDecimal(sum || 0) }}
            {{ tokenBalance.symbol }}
          </span>
        </div>
      </div>
    </td>
    <td class="whitespace-nowrap py-6 font-semibold">
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
    <td class="p-6 text-center font-semibold">
      <div v-if="!hide" class="mx-auto h-8 w-36">
        <SparklineChart v-if="tokenBalance.sparklinePrice7d.length" v-once :line-color="priceDiffColor" :sparkline-data="tokenBalance.sparklinePrice7d" />
        <span v-else> - </span>
      </div>
    </td>
    <td class="py-6 pl-10 text-sm font-semibold">
      <div v-if="!hide">
        <div v-if="priceDiffInPercent" class="flex flex-col gap-1">
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
    <td class="min-w-[138px] py-6 text-right">
      <Tippy
        v-if="!summary"
        :content="errorMessage"
        tag="div" class="flex items-center justify-center gap-[15px]"
      >
        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Send',
          }"
          :disabled="!interactable"
          class="!h-9 !w-9 items-center justify-center !p-0"
          @click="openSendModal(tokenBalance.chainId, tokenBalance.address)"
        >
          <CommonTxTypeIcon :disabled="!interactable" :hoverable="true">
            <template #icon>
              <SvgoArrowRight class="-rotate-45" />
            </template>
          </CommonTxTypeIcon>
        </CommonButton>

        <CommonButton
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Swap',
          }"
          :disabled="!interactable || isSwapDisabled"
          class="!h-9 !w-9 items-center justify-center !p-0"
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
          :disabled="!interactable || isBridgeDisabled"
          class="!h-9 !w-9 items-center justify-center !p-0"
          @click="openBridgeModal(tokenBalance.address, tokenBalance.chainId)"
        >
          <BridgeSVG />
        </CommonButton>
      </Tippy>
      <div v-else class="flex justify-end pr-[30px]">
        <ChevronDownSVG v-if="!collapse" class="h-[14px] w-[14px] text-slate-400" />
        <ChevronDownSVG v-else class="h-[14px] w-[14px] rotate-180 text-slate-400" />
      </div>
    </td>
  </tr>
</template>
