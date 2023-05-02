<script setup lang="ts">
import SVGSuccess from '~/assets/images/icons/check-circle.svg'
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg'
import SVGTriangle from '~/assets/images/icons/exclamation-triangle.svg'
import type { Notifications } from '~~/composables/useNotification'

const props = defineProps<{
  type: Notifications['type']
}>()

const textClass = computed(
  () =>
    ({
      success: 'text-[#22c55e]',
      info: 'text-[#3b82f6]',
      warning: 'text-[#ef9500]',
      error: 'text-[#eb5757]',
    }[props.type]),
)

const bgClass = computed(
  () =>
    ({
      success: 'bg-[#22c55e]',
      info: 'bg-[#3b82f6]',
      warning: 'bg-[#ef9500]',
      error: 'bg-[#eb5757]',
    }[props.type]),
)
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
