<script setup lang="ts">
const props = defineProps<{
  asset: NFTData
}>()

const { isNFTHidden, hiddenNFTs } = useNft()

function toggleNFT() {
  const nft = isNFTHidden(props.asset)
  if (nft.hidden)
    hiddenNFTs.value.splice(nft.index, 1)
  else
    hiddenNFTs.value.push(props.asset)
}
const isHidden = computed(() => {
  return isNFTHidden(props.asset).hidden
})
</script>

<template>
  <li class="relative rounded-5 bg-slate-150 dark:bg-slate-800">
    <button
      class="h-full w-full rounded-[inherit] p-2.5 text-left ring-slate-800 ring-opacity-10 focus-within:ring-1 focus:outline-none dark:ring-slate-150 dark:ring-opacity-10"
      @click="openNFTDetailsModal(asset)"
    >
      <figure class="flex h-full w-full flex-col gap-2.5">
        <NFTImage :asset="asset" />
        <figcaption class="flex flex-1 flex-col px-2">
          <span v-if="asset.name" class="text-xs font-bold leading-5">
            {{ asset.name }}
          </span>
          <span
            v-if="asset.collectionName"
            class="text-xs font-medium leading-5 text-slate-400"
          >
            {{ asset.collectionName }}
          </span>
        </figcaption>
      </figure>
    </button>
    <button
      class="absolute right-5 top-5 flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[#0000004D] hover:bg-[#8888884D]"
      @click="toggleNFT()"
    >
      <SvgoEyeOff v-if="isHidden" class="h-5 w-5 text-white" />
      <SvgoEye v-if="!isHidden" class="stroke-white-icon h-5 w-5" />
    </button>
  </li>
</template>
