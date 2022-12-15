<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder: string;
  inputClasses?: string;
}>();

const emit = defineEmits(["update:modelValue"]);

const handleInputChange = (e: Event) => {
  const result = (e.target as HTMLInputElement).value;
  emit("update:modelValue", result);
};
</script>

<template>
  <div class="relative">
    <slot name="prefix" />
    <input
      type="text"
      :placeholder="placeholder"
      :value="modelValue"
      @input="handleInputChange"
      :class="inputClasses"
      class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 h-12 rounded-[15px] w-full"
    />
   <slot name="suffix" />
  </div>
</template>
