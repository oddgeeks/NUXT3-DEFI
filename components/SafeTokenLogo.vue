<script setup lang="ts">
const props = defineProps<{
  url?: string
  chainId?: number | string
  networkLogoClass?: string
  count?: number
} > ()

const error = ref(false)

watch(() => props.url, () => {
  error.value = false
})

function onError() {
  error.value = true
}
</script>

<template>
  <div class="relative inline-flex h-10 w-10 rounded-full flex-shrink-0">
    <SvgFallbackLogo v-if="error || !url" />

    <template v-else>
      <img
        :src="url"
        class="w-full h-full rounded-full"
        :onerror="onError"
      >
    </template>

    <ChainLogo
      v-if="chainId"
      v-tippy="chainIdToName(chainId)"
      :stroke="true"
      class="w-5.5 h-5.5 absolute -left-1 -bottom-1"
      :class="[networkLogoClass]"
      :chain="chainId"
    />
    <div v-if="count" class="w-5 h-5 absolute -left-1 -bottom-1 border border-black bg-primary text-white text-center rounded-full text-[10px] md:text-xs flex items-center justify-center">
      {{ count }}
    </div>
  </div>
</template>
