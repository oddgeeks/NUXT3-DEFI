<script setup lang="ts">
defineProps<{
  address: string
}>()
</script>

<template>
  <SvgoAvatar
    :style="{
      color: generateColor(address),
    }"
  />
</template>
