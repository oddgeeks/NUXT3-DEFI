<script lang="ts" setup>

</script>

<template>
  <div class="items-center justify-end py-8 hidden sm:flex">
    <NuxtLink class="mr-auto" to="/">
      <Logo />
    </NuxtLink>
    <nav class="flex items-center gap-7.5 relative">
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
      </div>
    </nav>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
