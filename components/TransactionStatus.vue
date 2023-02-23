<script setup lang="ts">
import SVGCheckCircle from "~/assets/images/icons/check-circle.svg?component";
import SVGErrorCircle from "~/assets/images/icons/error-circle.svg?component";
import SVGClockCircle from "~/assets/images/icons/clock-circle.svg?component";
import SVGInfoCircle from "~/assets/images/icons/exclamation-circle.svg?component";

const props = defineProps<{
  status: IAvocadoTransaction["status"] | "ready" | "completed";
}>();

const statusColor = computed(() => {
  switch (props.status) {
    case "success":
    case "completed":
    case "ready":
      return "text-green-400";
    case "failed":
      return "text-red-500";
    case "dropped":
      return "text-gray-500";
    default:
      return "text-yellow";
  }
});
</script>

<template>
  <span :class="statusColor" class="inline-flex gap-2.5 items-center capitalize">
    <SVGCheckCircle class="text-white w-4 h-4 success-circle"
      v-if="status === 'success' || status === 'completed' || status === 'ready'" />
    <SVGInfoCircle class="text-gray-400 w-4 h-" v-else-if="status === 'dropped'" />
    <SVGErrorCircle class="text-white w-4 h-4" v-else-if="status === 'failed'" />
    <SVGClockCircle v-else class="w-4 h-4" />
    {{ status }}
    <slot />
  </span>
</template>
