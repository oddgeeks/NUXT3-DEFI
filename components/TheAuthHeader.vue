<script setup lang="ts">
defineProps<{
  to?: string
}>()
</script>

<template>
  <div class="items-center justify-end py-8 flex">
    <NuxtLink class="mr-auto flex items-center gap-2.5" :to="to || '/'">
      <SvgoAvocadoLogo />
      <slot name="logo-suffix" />
    </NuxtLink>
    <nav class="flex items-center gap-7.5 relative">
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
      </div>
    </nav>
  </div>
</template>
