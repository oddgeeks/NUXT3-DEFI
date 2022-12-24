<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

withDefaults(defineProps<{
  modelValue?: string | number | boolean | null | undefined;
  placeholder: string;
  inputClasses?: string;
  name: string;
  errorMessage?: string;
  type?: string;
  inputmode?: any;
  step?: string;
  min?: string;
}>(), {
  placeholder: "",
  name: "",
  type: "text",
  errorMessage: "",
});

const emit = defineEmits(["update:modelValue"]);

const handleInputChange = (e: Event) => {
  const result = (e.target as HTMLInputElement).value;
  emit("update:modelValue", result);
};
</script>

<template>
  <div>
    <div class="relative">
    <slot name="prefix" />
    <input
      :placeholder="placeholder"
      :value="modelValue"
      :name="name"
      :type="type"
      :step="step"
      :inputmode="inputmode"
      @input="handleInputChange"
      :min="min"
      :class="[inputClasses, !!errorMessage && '!ring-red-alert !ring-2']"
      class="bg-slate-800 placeholder-slate-400 focus:ring-2 border-none focus:bg-gray-850 focus:ring-slate-750 text-slate-200 px-5 py-[13px] rounded-[15px] w-full"
    />
   <slot name="suffix" />
  </div>
  <span class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert" v-if="!!errorMessage">
    <SVGInfo  />
    {{ errorMessage }}</span>
  </div>
</template>
