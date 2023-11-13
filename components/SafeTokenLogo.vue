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
  <div class="relative inline-flex h-10 w-10 shrink-0 rounded-full">
    <SvgFallbackLogo v-if="error || !url" />

    <template v-else>
      <img
        :src="url"
        class="h-full w-full rounded-full"
        :onerror="onError"
        loading="lazy"
      >
    </template>

    <ChainLogo
      v-if="chainId"
      v-tippy="chainIdToName(chainId)"
      :stroke="true"
      class="absolute -bottom-1 -left-1 h-5.5 w-5.5"
      :class="[networkLogoClass]"
      :chain="chainId"
    />
    <div v-if="count" class="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border  border-black bg-primary text-center text-[10px] text-white md:text-xs">
      {{ count }}
    </div>
  </div>
</template>
