<script setup lang="ts">
defineProps<{
  action: string
}>()
</script>

<template>
  <SvgoArrowRight v-if="action === 'transfer'" class="text-red-alert w-4 h-4 -rotate-45" />
  <SvgoRefresh v-else-if="action === 'swap'" class="w-4 h-4 text-primary" />
  <SvgoBridge v-else-if="action === 'bridge'" class="w-4 h-4 text-primary" />
  <SvgoGas v-else-if="action === 'gas-topup'" class="w-4 h-4 text-primary" />
</template>
