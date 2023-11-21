<script setup lang="ts">
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg?component'
import SVGErrorCircle from '~/assets/images/icons/error-circle.svg?component'
import SVGClockCircle from '~/assets/images/icons/clock-circle.svg?component'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg?component'

const props = defineProps<{
  status: IAvocadoTransaction['status'] | 'ready' | 'completed'
  hideText?: boolean
}>()

const statusColor = computed(() => {
  switch (props.status) {
    case 'success':
    case 'completed':
    case 'ready':
      return 'text-green-400'
    case 'failed':
      return 'text-red-500'
    case 'dropped':
      return 'text-[inherit]'
    default:
      return 'text-yellow'
  }
})
</script>

<template>
  <span
    :class="statusColor"
    class="inline-flex items-center gap-2.5 rounded-[14px] bg-gray-850 capitalize sm:!bg-transparent sm:p-0 sm:px-2.5 sm:py-3"
  >
    <SVGCheckCircle
      v-if="
        status === 'success' || status === 'completed' || status === 'ready'
      "
      class="success-circle h-5 w-5 text-white sm:h-4 sm:w-4"
    />
    <SVGInfoCircle
      v-else-if="status === 'dropped'"
      class="h-5 w-5 text-slate-600 sm:h-4 sm:w-4"
    />
    <SVGErrorCircle
      v-else-if="status === 'failed'"
      class="h-5 w-5 text-white sm:h-4 sm:w-4"
    />
    <SVGClockCircle v-else class="h-5 w-5 sm:h-4 sm:w-4" />
    <span v-if="!hideText">{{ status }}</span>
    <slot />
  </span>
</template>
