<script setup lang="ts">
defineProps<{
  modelValue: any
  rootAttrs?: any
  errorMessage?: string
}>()

defineEmits(['update:modelValue'])
</script>

<template>
  <div v-bind="rootAttrs" class="flex w-full flex-col">
    <textarea :value="modelValue" v-bind="$attrs" class="w-full rounded-[15px] border-0 bg-gray-900 focus-within:bg-gray-850 focus-within:ring-1 focus-within:ring-slate-750" @input="(e: any) => $emit('update:modelValue', e.target.value)" />
    <span
      v-if="!!errorMessage"
      class="mt-2 flex items-center gap-2 text-left text-xs text-red-alert"
    >
      <SvgoInfo2 class="shrink-0" />
      {{ errorMessage }}
    </span>
  </div>
</template>
