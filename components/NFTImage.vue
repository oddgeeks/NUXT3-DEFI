<script setup lang="ts">
import BrokenSVG from '~/assets/images/icons/broken.svg?component'
import ExpandSVG from '~/assets/images/icons/expand.svg?component'
import ShrinkSVG from '~/assets/images/icons/shrink.svg?component'

defineProps<{
  asset: NFTData
  imgClass?: string
  details?: boolean
  hideChainLogo?: boolean
  compact?: boolean
}>()

const error = ref(false)

const expanded = inject('expanded') as Ref<boolean>
const toggle = inject('toggle') as () => void

function handleError() {
  error.value = true
}

async function handleToggle() {
  const wrapper = document.querySelector('.modal-height-wrapper')

  // set height zero and visibility hidden
  if (!expanded.value)
    wrapper?.classList.add('!h-0', '!invisible')

  // set height auto and visibility visible
  if (expanded.value)
    wrapper?.classList.remove('!h-0', '!invisible')

  toggle()
}
</script>

<template>
  <div
    :class="[expanded ? 'sm:scale-[1.35] scale-110 origin-center z-10 visible' : '']"
    class="w-full relative animate-scale"
  >
    <div
      v-if="error || !asset.imageUrl"
      :class="compact ? 'w-8 h-8' : 'w-[168] h-[240px]'"
      class="dark:bg-gray-850 bg-slate-50 rounded-[14px] flex justify-center items-center"
    >
      <BrokenSVG />
    </div>

    <video v-else-if="asset.animationUrl && details" :poster="asset?.thumbnailUrl" class="rounded-[14px] object-contain max-h-full w-full" playsinline autoplay loop :src="formatIPFSUri(asset.animationUrl)" />

    <img
      v-else
      class="rounded-[14px] w-full sm:w-full h-[240px]"
      width="168"
      height="160"
      :src="details ? asset.imageUrl : asset?.thumbnailUrl ?? asset.imageUrl"
      :alt="asset.collectionName"
      :class="[imgClass, expanded ? 'sm:!h-auto sm:w-auto h-full sm:max-h-[70vh] object-contain max-h-full' : 'object-cover']"
      @error="handleError"
    >
    <div
      v-if="!hideChainLogo"
      :class="{
        'text-xs p-1.5': !details,
        'p-2 font-bold': details,
        'scale-75': expanded,
      }"
      class="backdrop-blur-[20px] absolute left-2.5 bottom-2.5 w-fit leading-[18px]  items-center flex gap-1.5 rounded-10 bg-black bg-opacity-30"
    >
      <ChainLogo
        :class="{
          'w-5': !details,
          'w-6': details,
        }" class="shrink-0" :chain="asset.chainId"
      />
      <span class="shrink-0 mr-1 text-white">
        {{ chainIdToName(asset.chainId) }}
      </span>
    </div>
    <button v-if="details && asset.imageUrl" :class="{ 'scale-75': expanded }" class="absolute w-10 h-10 right-2.5 bottom-2.5 bg-black bg-opacity-30 backdrop-blur-[20px] rounded-full flex items-center justify-center" @click="handleToggle">
      <ExpandSVG v-if="!expanded" />
      <ShrinkSVG v-else />
    </button>
  </div>
</template>

<style scoped>
.animate-scale {
     transition: transform 0.3s cubic-bezier(0.79,0.14,0.15,0.86);
    }
</style>
