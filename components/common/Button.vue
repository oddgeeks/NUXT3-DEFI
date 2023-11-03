<script setup lang="ts">
interface ButtonProps {
  color?: 'blue' | 'red' | 'white' | 'orange' | 'primary'
  size?: 'md' | 'lg' | 'sm'
  loading?: boolean
  as?: 'button' | 'a' | 'NuxtLink'
  disabled?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  color: 'primary',
  size: 'md',
  loading: false,
  as: 'button',
})

const componentToShow = computed(() => {
  if (props.as === 'NuxtLink')
    return resolveComponent('NuxtLink')
  return props.as
})
</script>

<template>
  <component
    :is="componentToShow"
    :type="as === 'button' ? 'button' : undefined"
    :class="[
      {
        'bg-red-alert text-white hover:bg-red-500 disabled:bg-gray-900 disabled:text-gray-500':
          color === 'red',
      },
      {
        'bg-orange text-white hover:bg-orange-400 disabled:bg-gray-900 disabled:text-gray-500':
          color === 'orange',
      },
      {
        'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-slate-200 disabled:text-gray-400 dark:disabled:bg-gray-900 dark:disabled:text-gray-500':
          color === 'blue',
      },
      {
        'bg-primary text-white hover:bg-primary-hover disabled:bg-slate-200 disabled:text-gray-400 dark:disabled:bg-gray-900 dark:disabled:text-gray-500':
          color === 'primary',
      },
      {
        'bg-slate-100 disabled:text-gray-400 dark:bg-gray-900 dark:disabled:text-gray-500':
          color === 'white',
      },
      {
        'rounded-5 px-[15px] py-1 text-xs leading-5': size === 'sm',
      },
      {
        'rounded-5 px-5.5 py-2 text-sm': size === 'md',
      },
      {
        'rounded-10 px-5.5 py-3 text-sm': size === 'lg',
      },
    ]"
    class="inline-flex font-semibold disabled:pointer-events-none disabled:select-none"
    :disabled="disabled || loading"
  >
    <slot name="prefix" />
    <slot v-if="!loading" />
    <div v-else class="dot-flashing my-1.5" />
    <slot name="suffix" />
  </component>
</template>

<style scoped>
.dot-flashing {
  @apply relative w-2 h-2 rounded-full bg-white text-white;
  animation: dot-flashing 1s infinite linear alternate;
  animation-delay: 0.5s;
}
.dot-flashing::before,
.dot-flashing::after {
  content: "";
  @apply inline-block absolute top-0;
}
.dot-flashing::before {
  @apply w-2 h-2 rounded-full bg-white text-white;
  left: -13px;
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 0s;
}
.dot-flashing::after {
  @apply w-2 h-2 rounded-full bg-white text-white;
  left: 13px;
  animation: dot-flashing 1s infinite alternate;
  animation-delay: 1s;
}

@keyframes dot-flashing {
  0% {
    background-color: rgba(255, 255, 255, 1);
  }
  50%,
  100% {
    background-color: rgba(255, 255, 255, 0.3);
  }
}
</style>
