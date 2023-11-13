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
        flex-row items-center gap-2.5 rounded-10 border p-2.5 pl-3.5 text-gray-400"
    :class="{
      'border-gray-800  bg-gray-900 text-white': selected,
      'border-slate-750 bg-gray-850': !selected,
    }"
    @click="onUpdateSelected"
  >
    <slot name="content" />
  </div>
</template>
