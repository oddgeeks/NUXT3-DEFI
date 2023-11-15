<script lang="ts" setup>
import type { IBalance } from '~/stores/safe'

defineProps<{
  tokenBalance: IBalance
  summary?: boolean
  sum?: number
  sumInUsd?: number
  collapse?: boolean
  onToggle?: Function
  individual?: boolean
  count?: number
}>()
</script>

<template>
  <button
    type="button"
    :class="`flex text-left py-3.5 px-4.5 justify-between items-center ${individual ? 'rounded-5' : (!summary ? 'border-t border-gray-800' : '')}`"
    @click="onToggle"
  >
    <div class="flex max-w-[50%] flex-1 gap-2.5">
      <SafeTokenLogo v-if="individual" network-logo-class="!w-4.5 !h-4.5" class="h-7.5 w-7.5" :chain-id="tokenBalance.chainId" :url="tokenBalance.logoURI" />
      <SafeTokenLogo v-else-if="summary" network-logo-class="!w-4.5 !h-4.5" class="!h-7.5 !w-7.5" :url="tokenBalance.logoURI" :count="count" />
      <div v-else class="relative pl-7.5">
        <ChainLogo
          v-tippy="chainIdToName(tokenBalance.chainId)"
          :stroke="true"
          class="absolute right-0 top-0 h-5.5 w-5.5"
          :chain="tokenBalance.chainId"
        />
      </div>

      <div class="items-left flex flex-1 flex-col">
        <div class="text-shadow min-w-0 max-w-[75%] flex-col overflow-hidden whitespace-nowrap text-xs font-bold uppercase leading-5">
          {{ tokenBalance.name }}
        </div>
        <p class="text-xs uppercase leading-5">
          {{ formatDecimal(!summary ? tokenBalance.balance || 0 : sum || 0) }} {{ tokenBalance.symbol }}
        </p>
        <div class="text-xs uppercase leading-5 text-gray-400">
          {{ formatUsd(!summary ? tokenBalance.balanceInUSD : sumInUsd) }}
        </div>
      </div>
    </div>
    <ActionsButtonGroup v-if="!summary" :token-balance="tokenBalance" />

    <SvgoChevronDown v-else :class="collapse ? 'rotate-180' : ''" class="h-4 w-4 text-gray-400" />
  </button>
</template>
