<script setup lang="ts">
import SVGSuccess from "~/assets/images/icons/check-circle.svg?component";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";
import SVGTriangle from "~/assets/images/icons/exclamation-triangle.svg?component";
import { Notifications } from "~~/composables/useNotification";

const props = defineProps<{
  type: Notifications["type"];
}>();

const textClass = computed(
  () =>
    ({
      success: "text-hex-22c55e",
      info: "text-hex-3b82f6",
      warning: "text-hex-ef9500",
      error: "text-hex-eb5757",
    }[props.type])
);

const bgClass = computed(
  () =>
    ({
      success: "bg-hex-22c55e",
      info: "bg-hex-3b82f6",
      warning: "bg-hex-ef9500",
      error: "bg-hex-eb5757",
    }[props.type])
);
</script>

<template>
  <div
    class="flex h-[50px] w-[50px] shrink-0 place-content-center place-items-center rounded-xl"
    :class="bgClass"
  >
    <SVGSuccess v-if="type === 'success'" :class="textClass" />
    <SVGInfo v-if="type === 'info'" :class="textClass" />
    <SVGTriangle
      v-if="type === 'error' || type === 'warning'"
      :class="textClass"
    />
  </div>
</template>
