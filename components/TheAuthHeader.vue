<script setup lang="ts">
defineProps<{
  to?: string
}>()
</script>

<template>
  <div class="flex items-center justify-end py-8">
    <NuxtLink class="mr-auto" to="/">
      <SvgoAvocadoLogo />
      <slot name="logo-suffix" />
    </NuxtLink>
    <nav class="relative flex items-center gap-7.5">
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
      </div>
    </nav>
  </div>
</template>
