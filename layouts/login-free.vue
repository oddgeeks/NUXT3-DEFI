<script setup lang="ts">
</script>

<template>
  <section class="flex flex-col">
    <div class="flex bg-slate-50 dark:bg-gray-950">
      <div class="flex flex-1 flex-col sm:px-10 px-4 max-w-7xl mx-auto min-w-0">
        <TheAuthHeader />
        <slot />
        <TheFooter />
      </div>
    </div>
  </section>
</template>
