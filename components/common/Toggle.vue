<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    text: string
    modelValue?: Boolean
  }>(),
  {
    text: '',
    modelValue: false,
  },
)

const emit = defineEmits(['update:modelValue'])
function change(ev: Event) {
  emit('update:modelValue', ev.target.checked)
}
</script>

<template>
  <div class="flex flex-rows items-center gap-[16px]">
    <span class="ml-3 text-xs font-medium text-gray-900 dark:text-gray-300">{{ text }}</span>
    <label class="relative inline-flex items-center cursor-pointer">
      <input :checked="modelValue" type="checkbox" class="sr-only peer" @change="change">
      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
    </label>
  </div>
</template>
