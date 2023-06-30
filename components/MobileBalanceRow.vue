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
      <div v-else class="w-10 h-10 relative">
        <ChainLogo
          v-tippy="chainIdToName(tokenBalance.chainId)"
          :stroke="true"
          class="w-5.5 h-5.5 absolute right-0 top-0"
          :chain="tokenBalance.chainId"
        />
      </div>

      <div class="flex flex-col items-left">
        <div class="font-semibold w-44 text-shadow max-w-[256px] overflow-hidden uppercase">
          {{
            formatDecimal(!summary ? tokenBalance.balance : sum)
          }}
          {{ tokenBalance.symbol }}
        </div>
        <div class="text-sm font-medium text-slate-400 max-w-[256px] uppercase">
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
      <ChevronDownSVG v-if="!collapse" class="text-slate-400 w-[14px] h-[14px]" />
      <ChevronDownSVG v-else class="text-slate-400 w-[14px] h-[14px] rotate-180" />
    </div>
  </div>
</template>
