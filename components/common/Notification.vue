<script setup lang="ts">
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'

type NotificationType = 'success' | 'error' | 'warning'

const props = withDefaults(
  defineProps<{
    text: string
    type?: NotificationType
  }>(),
  {
    type: 'success',
  },
)

const typeClass = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-400 text-green-400'
    case 'error':
      return 'bg-red-alert text-red-alert'
    case 'warning':
      return 'bg-orange-400 text-orange-400'
  }
})
</script>

<template>
  <div
    :class="typeClass"
    class="rounded-7.5 flex items-center justify-between px-4 py-2.5 max-h-[100px] min-h-[50px] bg-opacity-10 overflow-hidden"
  >
    <div class="flex items-center gap-2.5">
      <SVGInfo class="w-[18px] h-[18px] shrink-0" />
      <span class="text-xs whitespace-pre-line"> {{ text }}</span>
    </div>
    <slot name="action" />
  </div>
</template>
