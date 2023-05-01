<script setup lang="ts">
defineProps<{
  url: string
  chainId?: number | string
} > ()

const error = ref(false)

function onError() {
  error.value = true
}
</script>

<template>
  <div class="relative inline-block h-10 w-10 rounded-full flex-shrink-0">
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
      :stroke="true"
      class="w-5.5 h-5.5 absolute -left-1 -bottom-1"
      :chain="chainId"
    />
  </div>
</template>
