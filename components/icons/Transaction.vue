<script lang="ts" setup>
const props = defineProps({
  bgGreen: {
    type: Boolean,
    default: true,
  },
})

const bgClass = computed(() => props.bgGreen ? 'bg-primary' : '')

</script>

<template>
  <div class="w-10 h-10 rounded-full items-center flex justify-center shrink-0"
    :class="bgClass"
  >
    <slot name="icon" />
  </div>
</template>