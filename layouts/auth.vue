<script setup lang="ts">
</script>

<template>
  <section class="flex flex-col">
    <div class="flex">
      <div class="flex flex-1 flex-col sm:px-10 px-4 max-w-7xl mx-auto min-w-0">
        <slot />
        <div class="mt-top">
          <TheFooter />
        </div>
      </div>
    </div>
  </section>
</template>
