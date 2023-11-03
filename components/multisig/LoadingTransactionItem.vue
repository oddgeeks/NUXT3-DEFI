<template>
  <div class="flex cursor-pointer items-center gap-2.5 px-5 py-4 text-xs font-medium leading-5 text-gray-400">
    <div class="loading w-5" />
    <div class="loading mr-16 w-24" />
    <div class="loading w-5" />
    <div class="loading w-20" />
    <div class="loading w-24" />
    <div class="loading w-32" />
    <div class="loading ml-auto w-20" />
    <div class="loading w-5" />
  </div>
</template>

<style scoped>
.loading {
  @apply dark:bg-gray-900 bg-slate-150 rounded-5 h-5;
}
</style>
