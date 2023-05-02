<script setup lang="ts">
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg'
import SVGErrorCircle from '~/assets/images/icons/error-circle.svg'
import SVGClockCircle from '~/assets/images/icons/clock-circle.svg'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg'

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
    class="inline-flex sm:px-2.5 sm:py-3 sm:p-0 rounded-[14px] dark:bg-gray-850 bg-slate-50 sm:!bg-transparent gap-2.5 items-center capitalize"
  >
    <SVGCheckCircle
      v-if="
        status === 'success' || status === 'completed' || status === 'ready'
      "
      class="text-white w-5 h-5 sm:w-4 sm:h-4 success-circle"
    />
    <SVGInfoCircle
      v-else-if="status === 'dropped'"
      class="text-slate-600 w-5 h-5 sm:w-4 sm:h-4"
    />
    <SVGErrorCircle
      v-else-if="status === 'failed'"
      class="text-white w-5 h-5 sm:w-4 sm:h-4"
    />
    <SVGClockCircle v-else class="w-5 h-5 sm:w-4 sm:h-4" />
    <span v-if="!hideText">{{ status }}</span>
    <slot />
  </span>
</template>
