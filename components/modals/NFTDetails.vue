<script setup lang="ts">
const props = defineProps<{
  asset: NFTData
}>()
defineEmits(['destroy'])

const isContractERC1155 = computed(() => props.asset.contractType === 'ERC1155')

const disabled = computed(() => isContractERC1155.value)
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <NFTImage
      details
      img-class="sm:!h-[324px] sm:w-full"
      class="!sm:h-full"
      :asset="asset"
    />
    <div class="flex gap-3 flex-col">
      <h1 v-if="asset.name" class="text-center text-lg leading-5">
        {{ asset.name }}
      </h1>
      <h2
        v-if="asset.collectionName"
        class="text-sm text-slate-400 font-medium text-center"
      >
        {{ asset.collectionName }}
      </h2>
    </div>
    <CommonButton :disabled="disabled" class="w-full justify-center" size="lg" @click="$emit('destroy'), openSendNFTModal(asset)">
      Send NFT
    </CommonButton>
    <p v-if="isContractERC1155" class="text-sm text-orange-400 text-center">
      ERC1155 transfer not supported yet
    </p>
  </div>
</template>
