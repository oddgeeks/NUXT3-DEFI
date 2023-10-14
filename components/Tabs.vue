<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { sessions } = storeToRefs(useWalletConnectV2())
const { safeBookmarks } = useBookmark()

const tabs = computed<INavigationTab[]>(() => {
  return [
    {
      label: 'Connected Dapps',
      query: undefined,
      value: 'dapps',
      count: sessions.value?.length || 0,
    },
    {
      label: 'Transaction Shortcuts',
      query: 'bookmarks',
      value: 'bookmarks',
      count: safeBookmarks.value?.length || 0,
    },
  ]
})
</script>

<template>
  <div class="overflow-auto">
    <ul class="flex w-fit justify-center rounded-5 bg-slate-50 p-1.5 text-sm font-medium dark:bg-gray-850 sm:justify-normal sm:rounded-10">
      <li v-for="tab in tabs" :key="tab.label">
        <NuxtLink :class=" $route.query.tab === tab.query ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'" class="flex items-center gap-2.5 whitespace-nowrap rounded-2xl px-6 py-2.5 sm:rounded-7.5" :to="{ query: { tab: tab.query } }">
          {{ tab.label }}
          <span class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-500 px-[5px] text-xs text-white">
            {{ tab.count }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
