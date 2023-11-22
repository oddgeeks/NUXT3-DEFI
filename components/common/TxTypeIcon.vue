<script lang="ts" setup>
interface TxTypeProps {
  disabled?: boolean
  color?: 'light' | 'default'
  hoverable?: boolean
}

const props = withDefaults(defineProps<TxTypeProps>(), {
  disabled: false,
  color: 'default',
  hoverable: false,
})

const colorClasses = {
  default: {
    active: 'bg-primary text-white',
    disabled: 'bg-gray-900 disabled:text-gray-500',
  },
  light: {
    active: 'bg-primary text-white ',
    disabled: 'bg-slate-600 !text-gray-500',
  },
}

const bgClass = computed(() =>
  props.disabled
    ? colorClasses[props.color].disabled
    : colorClasses[props.color].active,
)

const classes = computed(() => {
  return [
    'rounded-full items-center flex justify-center shrink-0',
    bgClass.value,
    props.hoverable ? 'hover:bg-primary-hover' : '',
  ].join(' ')
})
</script>

<template>
  <div :class="classes">
    <slot name="icon" />
  </div>
</template>
