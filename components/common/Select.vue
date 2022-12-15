<template>
  <select
    v-model="selected"
    class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
  >
    <option v-for="(option, index) in options" :value="getValue(option, index)">
      {{ getLabel(option) }}
    </option>
  </select>
</template>

<script lang="ts" setup>
const props = defineProps<{
  options: any[];
  labelKey?: string;
  valueKey?: string;
  isValueIndex?: boolean;
  modelValue?: any;
}>();

const emit = defineEmits(['update:modelValue'])

const selected =  computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue',value),
});

const getLabel = (option: any) => {
  if (props.labelKey) return option[props.labelKey];
  return option;
};

const getValue = (option: any, index?: number) => {
  if (props.isValueIndex) return index;
  if (props.valueKey) return option[props.valueKey];
  return option;
};
</script>
