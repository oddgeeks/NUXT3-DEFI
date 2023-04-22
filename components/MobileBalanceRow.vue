<script lang="ts" setup>
import type { IBalance } from '~/stores/safe'
import Options from '@/assets/images/icons/options.svg?component'

const props = defineProps<{
  tokenBalance: IBalance
}>()

const DECIMAL_PLACES = 5

const interactable = computed(() =>
  toBN(props.tokenBalance.balance).decimalPlaces(DECIMAL_PLACES).gt(0),
)
</script>

<template>
  <div
    class="flex py-3.5 px-4.5 justify-between items-center rounded-5 dark:bg-gray-850 bg-slate-50"
    @click="interactable && openBalanceModal(tokenBalance)"
  >
    <div class="flex items-center space-x-2.5">
      <div class="relative inline-block h-10 w-10 rounded-full flex-shrink-0">
        <img :src="tokenBalance.logoURI" class="h-10 w-10 rounded-full" :onerror="onImageError">

        <ChainLogo :stroke="true" class="w-5.5 h-5.5 absolute -left-1 -bottom-1" :chain="tokenBalance.chainId" />
      </div>
      <div class="flex flex-col items-left">
        <div class="font-semibold w-44 text-shadow max-w-[256px] overflow-hidden uppercase">
          {{
            toBN(tokenBalance.balance)
              .decimalPlaces(DECIMAL_PLACES)
              .toFormat()
          }}
          {{ tokenBalance.symbol }}
        </div>
        <div class="text-sm font-medium text-slate-400 max-w-[256px] uppercase">
          {{ formatUsd(tokenBalance.balanceInUSD) }}
        </div>
      </div>
    </div>
    <div
      :class="`w-[34px] h-[34px] bg-slate-150 dark:bg-slate-800 rounded-[12px] flex items-center justify-center text-slate-300 dark:text-slate-600 ${interactable && '!bg-green-500 !text-white'}`"
    >
      <Options />
    </div>
  </div>
</template>
