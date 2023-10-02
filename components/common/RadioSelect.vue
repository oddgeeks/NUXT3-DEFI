<script setup lang="ts">
interface IProps {
  modelValue?: any
  value: any
}
const props = defineProps<IProps>()

const emit = defineEmits(['update:modelValue'])

const selected = computed({
  get: () => props.modelValue === props.value,
  set: value => emit('update:modelValue', value),
})

function onUpdateSelected() {
  selected.value = props.value
}
</script>

<template>
  <div
    class="flex h-10 flex-1 grow cursor-pointer
        flex-row items-center gap-2.5 rounded-10 border p-2.5 pl-3.5 text-slate-400"
    :class="{
      'border-slate-100 bg-slate-100 text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-white': selected,
      'border-slate-100  bg-slate-50 dark:border-slate-750 dark:bg-gray-850': !selected,
    }"
    @click="onUpdateSelected"
  >
    <slot name="content" />
  </div>
</template>
