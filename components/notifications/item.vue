<script setup lang="ts">
import type { Notifications } from '~~/composables/useNotification'

const props = defineProps<NotificationItem>()

const { deleteItem } = useNotification()

interface NotificationItem {
  item: Notifications
}

onMounted(() => deleteItem(props.item.id, props.item.duration))
</script>

<template>
  <li
    class="flex items-center gap-5 rounded-5 border border-gray-800 bg-gray-850 p-3.5 pr-3"
  >
    <Component :is="item.as || 'div'" class="flex items-center gap-5 text-left" @click="item.onClick?.()">
      <div v-if="item.icon" class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Component :is="item.icon" class="h-4 w-4" />
      </div>
      <NotificationsIcon v-else :type="item.type" />
      <div>
        <h1 class="text-md text-slate-300">
          {{ item.title }}
        </h1>
        <div class="text-sm text-gray-400" v-html="item.message" />
      </div>
    </Component>
    <button
      class="flex h-7.5 w-7.5 items-center justify-center"
      aria-label="Hide notification"
      @click="deleteItem(item.id, 0)"
    >
      <SvgoX class="inline-flex h-2.5 w-2.5 shrink-0 text-gray-400" />
    </button>
  </li>
</template>
