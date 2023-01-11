<template>
  <tr class="transaction-row">
    <td>
      <div class="dark:bg-slate-800 bg-slate-150 rounded-5 w-[120px] h-5"></div>
    </td>
    <td class="flex gap-2">
      <div class="dark:bg-slate-800 bg-slate-150 rounded-full w-5 h-5"></div>
      <div class="dark:bg-slate-800 bg-slate-150 rounded-5 w-20 h-5"></div>
    </td>
    <td>
      <div
        class="dark:bg-slate-800 bg-slate-150 rounded-full w-[110px] h-5"
      ></div>
    </td>
    <td>
      <div
        class="dark:bg-slate-800 bg-slate-150 rounded-full w-[110px] h-5"
      ></div>
    </td>
    <td class="flex gap-2">
      <div class="dark:bg-slate-800 bg-slate-150 rounded-full w-5 h-5"></div>
      <div class="dark:bg-slate-800 bg-slate-150 rounded-5 w-20 h-5"></div>
    </td>
    <td>
      <div class="dark:bg-slate-800 bg-slate-150 rounded-full w-14 h-5"></div>
    </td>
    <td>
      <div
        class="dark:bg-slate-800 bg-slate-150 rounded-full w-[60px] h-5"
      ></div>
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
