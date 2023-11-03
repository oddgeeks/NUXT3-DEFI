<template>
  <tr class="transaction-row">
    <td>
      <div class="h-5 w-[120px] rounded-5 bg-slate-150 dark:bg-gray-900" />
    </td>
    <td class="flex gap-2">
      <div class="h-5 w-5 rounded-full bg-slate-150 dark:bg-gray-900" />
      <div class="h-5 w-20 rounded-5 bg-slate-150 dark:bg-gray-900" />
    </td>
    <td>
      <div
        class="h-5 w-[110px] rounded-full bg-slate-150 dark:bg-gray-900"
      />
    </td>
    <td>
      <div
        class="h-5 w-[110px] rounded-full bg-slate-150 dark:bg-gray-900"
      />
    </td>
    <td class="flex gap-2">
      <div class="h-5 w-5 rounded-full bg-slate-150 dark:bg-gray-900" />
      <div class="h-5 w-20 rounded-5 bg-slate-150 dark:bg-gray-900" />
    </td>
    <td>
      <div class="h-5 w-14 rounded-full bg-slate-150 dark:bg-gray-900" />
    </td>
    <td>
      <div
        class="h-5 w-[60px] rounded-full bg-slate-150 dark:bg-gray-900"
      />
    </td>
  </tr>
</template>

<style scoped>
.transaction-row > td {
  @apply py-2;
}

.transaction-row > td:first-child {
  @apply pl-7.5;
}

.transaction-row > td {
  @apply py-6 relative;
}
</style>
