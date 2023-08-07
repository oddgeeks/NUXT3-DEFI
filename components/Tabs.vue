<script setup lang="ts">
const tabs = computed<INavigationTab[]>(() => {
  return [
    {
      label: 'Connected Dapps',
      query: undefined,
      value: 'dapps',
    },
    {
      label: 'Transaction Shortcuts',
      query: 'bookmarks',
      value: 'bookmarks',
    },
  ]
})
</script>

<template>
  <ul class="dark:bg-gray-850 bg-slate-50 flex w-fit sm:flex-nowrap flex-wrap sm:justify-normal justify-center font-medium text-sm p-1.5 rounded-5 sm:rounded-10">
    <li v-for="tab in tabs" :key="tab.label">
      <NuxtLink :class=" $route.query.tab === tab.query ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'" class="flex items-center gap-2.5 px-6 py-2.5 rounded-2xl sm:rounded-7.5" :to="{ query: { tab: tab.query } }">
        {{ tab.label }}
      </NuxtLink>
    </li>
  </ul>
</template>
