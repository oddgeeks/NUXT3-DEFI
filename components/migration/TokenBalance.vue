<template>
  <div class="p-5 flex items-center border-b-[1px] last:border-b-[0px] border-slate-750">
    <div class="relative basis-[30px] h-[30px] grow-0 shrink-0">
      <SafeTokenLogo class="w-full h-full z-50" :url="tokenBalance.logoURI" />
      <ChainLogo
        v-tippy="chainIdToName(tokenBalance.chainId)"
        :stroke="true"
        class="w-5.5 h-5.5 absolute right-0 top-0"
        :chain="tokenBalance.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm text-white font-medium">{{ tokenBalance.name }}</div>
      <div class="text-xs text-slate-400 font-medium">{{ tokenBalance.balance }} {{ tokenBalance.symbol.toUpperCase() }}</div>
    </div>

    <div class="text-xs font-medium text-white ml-[10px]">{{ formatUsd(tokenBalance.balanceInUSD) }}</div>

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
const props = withDefaults(defineProps<{
  tokenBalance: IBalance
  isChecked: boolean
  showSelectedUi: boolean
}>(),
  {
    isChecked: false,
    showSelectedUi: false,
  },
)

const emits = defineEmits(['toggleCheck']);
</script>