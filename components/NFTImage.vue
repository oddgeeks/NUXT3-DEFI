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
    :class="[expanded ? 'visible z-10 origin-center scale-110 sm:scale-[1.35]' : '']"
    class="animate-scale relative w-full"
  >
    <div
      v-if="error || !asset.imageUrl"
      :class="compact ? 'w-8 h-8' : 'w-[168] h-[240px]'"
      class="flex w-[168] items-center justify-center rounded-[14px] bg-gray-850"
    >
      <BrokenSVG />
    </div>

    <video v-else-if="asset.animationUrl && details" :poster="asset?.thumbnailUrl" class="max-h-full w-full rounded-[14px] object-contain" playsinline autoplay loop :src="formatIPFSUri(asset.animationUrl)" />

    <img
      v-else
      class="h-[240px] w-full rounded-[14px] sm:w-full"
      width="168"
      height="160"
      :src="details ? asset.imageUrl : asset?.thumbnailUrl ?? asset.imageUrl"
      :alt="asset.collectionName"
      :class="[imgClass, expanded ? 'h-full max-h-full object-contain sm:!h-auto sm:max-h-[70vh] sm:w-auto' : 'object-cover']"
      @error="handleError"
    >
    <div
      v-if="!hideChainLogo"
      :class="{
        'p-1.5 text-xs': !details,
        'p-2 font-bold': details,
        'scale-75': expanded,
      }"
      class="absolute bottom-2.5 left-2.5 flex w-fit items-center  gap-1.5 rounded-10 bg-black bg-opacity-30 leading-[18px] backdrop-blur-[20px]"
    >
      <ChainLogo
        :class="{
          'w-5': !details,
          'w-6': details,
        }" class="shrink-0" :chain="asset.chainId"
      />
      <span class="mr-1 shrink-0 text-white">
        {{ chainIdToName(asset.chainId) }}
      </span>
    </div>
    <button v-if="details && asset.imageUrl" :class="{ 'scale-75': expanded }" class="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-black bg-opacity-30 backdrop-blur-[20px]" @click="handleToggle">
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
