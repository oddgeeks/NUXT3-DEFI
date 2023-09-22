<script setup lang="ts">
import { computedAsync } from '@vueuse/core'
import { toDataURL } from 'qrcode'

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
})

const dataURL = computedAsync(async () => {
  return toDataURL(props.url, {
    margin: 3,
    width: 600,
  })
})
</script>

<template>
  <img v-if="dataURL" class="rounded-lg" style="width: 200px; height: 200px;" :src="dataURL" alt="Qr Image">
</template>
