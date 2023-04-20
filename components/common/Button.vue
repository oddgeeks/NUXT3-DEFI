<script setup lang="ts">
interface ButtonProps {
  color?: 'blue' | 'red' | 'white' | 'orange'
  size?: 'md' | 'lg' | 'sm'
  loading?: boolean
  as?: 'button' | 'a' | 'NuxtLink'
}

const props = withDefaults(defineProps<ButtonProps>(), {
  color: 'blue',
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
        'bg-red-alert text-white hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500':
          color === 'red',
      },
      {
        'bg-orange text-white hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-500':
          color === 'orange',
      },
      {
        'bg-primary text-white hover:bg-primary-hover dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:text-slate-400 disabled:bg-slate-200':
          color === 'blue',
      },
      {
        'dark:bg-slate-800 bg-slate-100 dark:disabled:text-slate-500 disabled:text-slate-400':
          color === 'white',
      },
      {
        'text-xs py-1 px-[15px] rounded-5 leading-5': size === 'sm',
      },
      {
        'text-sm py-2 px-5.5 rounded-5': size === 'md',
      },
      {
        'text-sm py-3 px-5.5 rounded-10': size === 'lg',
      },
    ]"
    class="font-semibold inline-flex disabled:pointer-events-none disabled:select-none"
    :disabled="loading"
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
