<script setup lang="ts">
</script>

<template>
  <section class="flex flex-col">
    <div class="flex bg-gray-975">
      <div class="mx-auto flex min-w-0 max-w-7xl flex-1 flex-col px-4 sm:px-10">
        <TheAuthHeader />
        <slot />
        <TheFooter />
      </div>
    </div>
  </section>
</template>
