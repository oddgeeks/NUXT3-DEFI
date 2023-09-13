<template>
  <div class="py-4 flex cursor-pointer items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
    <div class="loading w-5"></div>
    <div class="loading w-24 mr-16"></div>
    <div class="loading w-5"></div>
    <div class="loading w-20"></div>
    <div class="loading w-24"></div>
    <div class="loading w-32"></div>
    <div class="loading w-20 ml-auto"></div>
    <div class="loading w-5"></div>
  </div>
</template>
<style scoped>
.loading {
  @apply dark:bg-slate-800 bg-slate-150 rounded-5 h-5;
}
</style>