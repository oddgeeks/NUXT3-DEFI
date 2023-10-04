<script lang="ts" setup>
import type { IBalance } from '~/stores/safe'
import Options from '@/assets/images/icons/options.svg?component'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'

const props = defineProps<{
  tokenBalance: IBalance
  summary?: boolean
  sum?: number
  sumInUsd?: number
  collapse?: boolean
  onToggle?: Function
  individual?: boolean
  count?: number
}>()

const interactable = computed(() =>
  toBN(props.tokenBalance.balance).gt(0),
)

function onSelect() {
  if (props.summary)
    props.onToggle()
  else if (toBN(props.tokenBalance.balance).gt(0))
    openBalanceModal(props.tokenBalance)
}
</script>

<template>
  <div
    :class="`flex py-3.5 px-4.5 justify-between items-center ${individual ? 'rounded-5 dark:bg-gray-850 bg-slate-50' : (!summary ? 'border-t border-slate-100 dark:border-slate-800' : '')}`"
    @click="onSelect"
  >
    <div class="flex items-center space-x-2.5">
      <SafeTokenLogo v-if="individual" :chain-id="tokenBalance.chainId" :url="tokenBalance.logoURI" />
      <SafeTokenLogo v-else-if="summary" :url="tokenBalance.logoURI" :count="count" />
      <div v-else class="relative h-10 w-10">
        <ChainLogo
          v-tippy="chainIdToName(tokenBalance.chainId)"
          :stroke="true"
          class="absolute right-0 top-0 h-5.5 w-5.5"
          :chain="tokenBalance.chainId"
        />
      </div>

      <div class="items-left flex flex-col">
        <div class="text-shadow w-44 max-w-[256px] overflow-hidden font-semibold uppercase">
          {{
            formatDecimal(!summary ? tokenBalance.balance : sum)
          }}
          {{ tokenBalance.symbol }}
        </div>
        <div class="max-w-[256px] text-sm font-medium uppercase text-slate-400">
          {{ formatUsd(!summary ? tokenBalance.balanceInUSD : sumInUsd) }}
        </div>
      </div>
    </div>
    <div
      v-if="!summary"
      :class="`w-[34px] h-[34px] bg-slate-150 dark:bg-slate-800 rounded-[12px] flex items-center justify-center text-slate-300 dark:text-slate-600 ${interactable && '!bg-green-500 !text-white'}`"
    >
      <Options />
    </div>
    <div v-else>
      <ChevronDownSVG v-if="!collapse" class="h-[14px] w-[14px] text-slate-400" />
      <ChevronDownSVG v-else class="h-[14px] w-[14px] rotate-180 text-slate-400" />
    </div>
  </div>
</template>
