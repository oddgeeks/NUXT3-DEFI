<script lang="ts" setup>
defineProps<{
  text?: string
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
  <div class="flex flex-rows items-center gap-[16px]">
    <span v-if="text" class="ml-3 text-xs font-medium text-gray-900 dark:text-gray-300">{{ text }}</span>
    <label class="relative inline-flex items-center cursor-pointer">
      <input :name="name" :checked="modelValue" type="checkbox" class="sr-only peer" @change="change">
      <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary" />
    </label>
  </div>
</template>
