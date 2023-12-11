<script lang="ts" setup>
import type { IBalance } from '~/stores/safe'

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
  priceDiffClass,
  priceDiffInPercent,
  fetchLiteAPY,
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
            <NuxtLink v-if="liteAPY" external target="_blank" to="https://lite.instadapp.io" class="inline-flex items-center justify-center  rounded-5 bg-lite/10 px-2 py-1 text-[10px] font-medium leading-[10px] text-lite">
              Earn  {{ formatPercent(liteAPY) }} APY
            </NuxtLink>
          </div>
          <span
            v-if="!summary"
            v-tippy="`${toBN(tokenBalance.balance).toFormat()} ${tokenBalance.symbol?.toUpperCase()}`"
            class="max-w-[256px] text-sm font-medium uppercase text-gray-400"
          >
            {{
              formatDecimal(tokenBalance.balance)
            }}
            {{ tokenBalance.symbol }}
          </span>
          <span
            v-else
            v-tippy="`${sum} ${tokenBalance.symbol?.toUpperCase()}`"
            class="max-w-[256px] text-sm font-medium uppercase text-gray-400"
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
      <ActionsButtonGroup v-if="!summary" :token-balance="balance" />

      <div v-else class="flex justify-end pr-7.5">
        <SvgoChevronDown :class="collapse ? 'rotate-180' : ''" class="h-4 w-4 text-gray-400 " />
      </div>
    </td>
  </tr>
</template>
