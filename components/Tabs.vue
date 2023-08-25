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
  <div class="overflow-auto">
    <ul class="dark:bg-gray-850 bg-slate-50 flex w-fit justify-start md:justify-normal font-medium text-sm p-1.5 rounded-5 sm:rounded-10">
      <li v-for="tab in tabs" :key="tab.label" class="flex">
        <NuxtLink :class=" $route.query.tab === tab.query ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'" class="whitespace-nowrap flex items-center gap-2.5 px-6 py-2.5 rounded-2xl sm:rounded-7.5" :to="{ query: { tab: tab.query } }">
          {{ tab.label }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
