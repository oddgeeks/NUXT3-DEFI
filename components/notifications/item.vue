<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import { Notifications } from "~~/composables/useNotification";

const { deleteItem } = useNotification();

interface NotificationItem {
  item: Notifications;
}

const props = defineProps<NotificationItem>();

onMounted(() => deleteItem(props.item.id, props.item.duration));
</script>

<template>
  <li
    class="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 pr-2 ring-1 ring-slate-200 bg-slate-800 ring-slate-700"
  >
    <NotificationsIcon :type="item.type" />
    <div>
      <h1 class="text-md text-slate-300">{{ item.title }}</h1>
      <p class="text-sm text-slate-400">{{ item.message }}</p>
    </div>
    <button
      class="flex h-7.5 w-7.5 items-center justify-center"
      aria-label="Hide notification"
      @click="deleteItem(item.id, 0)"
    >
      <SVGX class="inline-flex h-2.5 w-2.5 flex-shrink-0 text-slate-400" />
    </button>
  </li>
</template>
