<script setup lang="ts">
defineProps<{
  modelValue: any
  rootAttrs?: any
  errorMessage?: string
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <div v-bind="rootAttrs" class="w-full flex flex-col">
    <textarea :value="modelValue" v-bind="$attrs" class="dark:bg-slate-800 w-full bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100" @input="(e: any) => $emit('update:modelValue', e.target.value)" />
    <span
      v-if="!!errorMessage"
      class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert"
    >
      <SvgoInfo2 class="shrink-0" />
      {{ errorMessage }}
    </span>
  </div>
</template>
