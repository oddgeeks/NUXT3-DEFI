<script setup lang="ts">
import BrokenSVG from '~/assets/images/icons/broken.svg?component'

defineProps<{
  asset: NFTData
  imgClass?: string
}>()

const error = ref(false)

function handleError() {
  error.value = true
}
</script>

<template>
  <div class="relative w-full">
    <div
      v-if="error || !asset.imageUrl"
      class="dark:bg-gray-850 bg-slate-50 rounded-[14px] w-full h-full sm:w-[168] sm:h-[160px] flex justify-center items-center"
    >
      <BrokenSVG />
    </div>
    <img
      v-else
      class="rounded-[14px] w-full h-full sm:w-[168px] sm:h-[160px] object-cover"
      width="168"
      height="160"
      :src="asset.imageUrl"
      :alt="asset.collectionName"
      :class="imgClass"
      loading="lazy"
      @error="handleError"
    >
    <div
      class="backdrop-blur-[20px] absolute left-1.5 bottom-1.5 w-fit leading-[18px] text-xs items-center flex gap-1.5 p-1.5 rounded-10 bg-black bg-opacity-30"
    >
      <ChainLogo class="shrink-0 w-5" :chain="asset.chainId" />
      <span class="shrink-0 mr-1 text-white">
        {{ chainIdToName(asset.chainId) }}
      </span>
    </div>
  </div>
</template>
