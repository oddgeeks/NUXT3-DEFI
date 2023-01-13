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
    class="flex items-center gap-5 rounded-2xl bg-gray-850 p-3.5 pr-3 ring-1 ring-slate-800"
  >
    <NotificationsIcon :type="item.type" />
    <div>
      <h1 class="text-md text-slate-300">{{ item.title }}</h1>
      <div class="text-sm text-slate-400" v-html="item.message"></div>
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
