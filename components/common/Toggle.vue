<script lang="ts" setup>
defineProps<{
  text?: string
  textClasses?: string
  modelValue?: boolean
  name?: string
}>()

const emit = defineEmits(['update:modelValue'])
function change(ev: Event) {
  const target = ev.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<template>
  <div class="flex-rows flex items-center gap-[16px]">
    <span v-if="text" :class="textClasses" class="ml-3 text-xs font-medium  text-gray-300">{{ text }}</span>
    <label class="relative inline-flex cursor-pointer items-center">
      <input :name="name" :checked="modelValue" type="checkbox" class="peer sr-only" @change="change">
      <div class="peer h-6 w-11 rounded-full border-gray-600 bg-gray-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
    </label>
  </div>
</template>
