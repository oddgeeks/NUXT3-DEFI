<script setup lang="ts">
const props = defineProps<{
  asset: NFTData
}>()
const hiddenNFTs = useLocalStorage<NFTData[]>('hiddenNFTs', [])
function toggleNFT() {
  const index = hiddenNFTs.value.findIndex(nft => nft.contractAddress.toLowerCase() === props.asset.contractAddress.toLowerCase() && nft.tokenId === props.asset.tokenId)
  if (index > -1)
    hiddenNFTs.value.splice(index, 1)
  else
    hiddenNFTs.value.push(props.asset)
}
const isHidden = computed(() => {
  return hiddenNFTs.value.findIndex(nft => nft.contractAddress.toLowerCase() === props.asset.contractAddress.toLowerCase() && nft.tokenId === props.asset.tokenId) > -1
})
</script>

<template>
  <li class="dark:bg-slate-800 bg-slate-150 rounded-5 relative">
    <button
      class="w-full p-2.5 h-full text-left focus:outline-none rounded-[inherit] focus-within:ring-1 dark:ring-slate-150 ring-slate-800 dark:ring-opacity-10 ring-opacity-10"
      @click="openNFTDetailsModal(asset)"
    >
      <figure class="h-full w-full flex flex-col gap-2.5">
        <NFTImage :asset="asset" />
        <figcaption class="flex-1 flex flex-col px-2">
          <span v-if="asset.name" class="text-xs font-bold leading-5">
            {{ asset.name }}
          </span>
          <span
            v-if="asset.collectionName"
            class="text-xs text-slate-400 font-medium leading-5"
          >
            {{ asset.collectionName }}
          </span>
        </figcaption>
      </figure>
    </button>
    <button
      class="absolute right-5 top-5 w-7.5 h-7.5 flex justify-center items-center bg-[#0000004D] hover:bg-[#8888884D] rounded-full"
      @click="toggleNFT()"
    >
      <SvgoEyeOff v-if="!isHidden" class="w-5 h-5 text-white" />
      <SvgoEye v-if="isHidden" class="w-5 h-5 stroke-white-icon" />
    </button>
  </li>
</template>
