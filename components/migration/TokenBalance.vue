<template>
  <div class="p-5 flex items-center border-b-[1px] last:border-b-[0px] dark:border-slate-750 border-white">
    <div class="relative basis-[30px] h-[30px] grow-0 shrink-0">
      <SafeTokenLogo class="w-full h-full" :url="tokenBalance.logoURI" />
      <ChainLogo
        v-tippy="chainIdToName(tokenBalance.chainId)"
        :stroke="true"
        class="w-[18px] h-[18px] absolute -left-1 -bottom-1"
        :chain="tokenBalance.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm dark:text-white text-slate-900 font-medium">{{ tokenBalance.name }}</div>
      <div class="text-xs text-slate-400 font-medium">{{ tokenBalance.balance }} {{ tokenBalance.symbol.toUpperCase() }}</div>
    </div>

    <div class="text-xs font-medium dark:text-white text-slate-900 ml-[10px]">{{ formatUsd(tokenBalance.balanceInUSD) }}</div>

    <input
      v-if="!props.showSelectedUi"
      type="checkbox"
      :checked="props.isChecked"
      class="ml-5 w-5 h-5 rounded-[6px] !bg-slate-700 border-0 outline-0 cursor-pointer"
      @click="emits('toggleCheck')"
    />
    <button v-else class="ml-5" @click="emits('toggleCheck')">
      <SVGX />
    </button>
  </div>
</template>

<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const props = withDefaults(defineProps<{
  tokenBalance: IBalance
  isChecked?: boolean
  showSelectedUi?: boolean
}>(),
  {
    isChecked: false,
    showSelectedUi: false,
  },
)

const emits = defineEmits(['toggleCheck']);
</script>