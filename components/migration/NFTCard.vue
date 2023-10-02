<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

defineProps<{
  asset: NFTData
  showSelectedUi?: boolean
  isChecked?: boolean
}>()

const emits = defineEmits(['toggleCheck'])
</script>

<template>
  <div class="p-5 flex items-center border-b-[1px] last:border-b-[0px] dark:border-slate-750 border-white">
    <div class="relative basis-[30px] h-[30px] grow-0 shrink-0">
      <NFTImage compact :asset="asset" hide-chain-logo img-class="w-[30px] h-[30px] rounded-[6px]" />
      <ChainLogo
        v-tippy="chainIdToName(asset.chainId)"
        :stroke="true"
        class="w-[18px] h-[18px] absolute -left-1 -bottom-1"
        :chain="asset.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm dark:text-white text-slate-900 font-medium">
        {{ asset.name }}
      </div>
      <div v-if="asset.collectionName" class="text-xs text-slate-400 font-medium">
        {{ asset.collectionName }}
      </div>
    </div>

    <input
      v-if="!showSelectedUi"
      type="checkbox"
      :checked="isChecked"
      class="ml-5 w-5 h-5 rounded-[6px] !bg-slate-700 border-0 outline-0 cursor-pointer"
      @click="emits('toggleCheck')"
    >
    <button v-else class="ml-5" @click="emits('toggleCheck')">
      <SVGX />
    </button>
  </div>
</template>
