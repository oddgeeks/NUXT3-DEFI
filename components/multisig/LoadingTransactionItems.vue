<template>
  <div class="pointer-events-none flex flex-col gap-5 rounded-2xl bg-slate-50 blur dark:bg-gray-850">
    <div v-for="i in 3" :key="i" class="border-b border-slate-300 dark:border-slate-750">
      <MultisigLoadingTransactionItem />
    </div>
    <div class="flex cursor-pointer items-center gap-2.5 px-5 py-8 text-xs font-medium leading-5 text-slate-400">
      <div class="loading-pagination ml-4 w-64" />
      <div class="loading-pagination ml-auto w-16" />
      <div class="loading-pagination w-10" />
      <div class="loading-pagination w-10" />
      <div class="loading-pagination w-16" />
    </div>
  </div>
</template>

<style scoped>
.loading-pagination {
    @apply dark:bg-slate-800 bg-slate-150 rounded-5 h-8;
}
</style>
