<script setup lang="ts">
defineProps<BadgeProps>()

enum ColorClass {
  blue = 'bg-blue-400 text-blue-400 bg-opacity-10',
  green = 'bg-green-500 bg-opacity-[15%] text-green-500',
  red = 'bg-red-alert bg-opacity-[15%] text-red-alert',
  yellow = 'bg-orange-500 bg-opacity-[15%] text-orange-500',
}

interface BadgeProps {
  color: 'blue' | 'green' | 'red' | 'yellow'
}
</script>

<template>
  <div
    class="w-fit self-baseline rounded-5 px-2.5 py-0.5 text-[10px] leading-5"
    :class="ColorClass[color]"
  >
    <slot />
  </div>
</template>
