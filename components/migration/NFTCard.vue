<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const props = defineProps<{
  asset: NFTData
  showSelectedUi?: boolean
}>()

const emits = defineEmits(['toggleCheck'])

const { selectedNFTsForMigration } = storeToRefs(useMigration())

const isChecked = computed(() => {
  const index = selectedNFTsForMigration.value?.findIndex((selectedNFT) => {
    return `${selectedNFT.tokenId}-${selectedNFT.chainId}` === `${props.asset.tokenId}-${props.asset.chainId}`
  })
  return index > -1
})
</script>

<template>
  <div class="flex items-center border-b-[1px] border-slate-750 p-5 last:border-b-[0px]">
    <div class="relative h-[30px] shrink-0 grow-0 basis-[30px]">
      <NFTImage compact :asset="asset" hide-chain-logo img-class="w-[30px] h-[30px] rounded-[6px]" />
      <ChainLogo
        v-tippy="chainIdToName(asset.chainId)"
        :stroke="true"
        class="absolute -bottom-1 -left-1 h-[18px] w-[18px]"
        :chain="asset.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm font-medium ">
        {{ asset.name }}
      </div>
      <div v-if="asset.collectionName" class="text-xs font-medium text-slate-400">
        {{ asset.collectionName }}
      </div>
    </div>

    <input
      v-if="!showSelectedUi"
      type="checkbox"
      :checked="isChecked"
      class="ml-5 h-5 w-5 cursor-pointer rounded-[6px] border-0 !bg-slate-700 outline-0"
      @click="emits('toggleCheck')"
    >
    <button v-else class="ml-5" @click="emits('toggleCheck')">
      <SVGX />
    </button>
  </div>
</template>
