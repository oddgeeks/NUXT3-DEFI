<template>
    <div class="dark:bg-gray-850 rounded-2xl bg-slate-50 gap-5 flex flex-col animate-pulse">
      <div v-for="i in 3" :key="i" class="border-b border-slate-300 dark:border-slate-750">
        <MultisigLoadingTransactionItem />
      </div>
      <div class="py-8 flex cursor-pointer items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
        <div class="loading-pagination w-64 ml-4"></div>
        <div class="loading-pagination ml-auto w-16"></div>
        <div class="loading-pagination w-10"></div>
        <div class="loading-pagination w-10"></div>
        <div class="loading-pagination w-16"></div>
      </div>
    </div>
</template>
<style scoped>
.loading-pagination {
    @apply dark:bg-slate-800 bg-slate-150 rounded-5 h-8;
}
</style>