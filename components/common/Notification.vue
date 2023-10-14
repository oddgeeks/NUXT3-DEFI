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
    class="flex max-h-[100px] min-h-[50px] items-center justify-between overflow-hidden rounded-7.5 bg-opacity-10 px-4 py-2.5"
  >
    <div class="flex items-center gap-2.5">
      <SVGInfo class="h-[18px] w-[18px] shrink-0" />
      <span class="whitespace-pre-line text-xs"> {{ text }}</span>
    </div>
    <slot name="action" />
  </div>
</template>
