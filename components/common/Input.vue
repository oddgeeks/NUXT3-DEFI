<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null | undefined;
    placeholder: string;
    inputClasses?: string;
    name: string;
    errorMessage?: string;
    type?: string;
    inputmode?: any;
    step?: string;
    min?: string;
  }>(),
  {
    placeholder: "",
    name: "",
    type: "text",
    errorMessage: "",
  }
);

const emit = defineEmits(["update:modelValue"]);

const handleInputChange = (e: Event) => {
  const result = (e.target as HTMLInputElement).value;
  emit("update:modelValue", result);
};
</script>

<template>
  <div>
    <div
      :class="[inputClasses, !!errorMessage && '!ring-red-alert !ring-2']"
      class="relative flex items-center dark:bg-slate-800 focus-within:outline-none bg-slate-100 px-5 focus-within:ring-2 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100 rounded-[15px]"
    >
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
        class="placeholder-slate-400 border-none shadow-none focus:ring-0 focus:border-none bg-inherit rounded-[inherit] px-0 py-[13px] w-full"
      />
      <slot name="suffix" />
    </div>
    <span
      class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert"
      v-if="!!errorMessage"
    >
      <SVGInfo />
      {{ errorMessage }}</span
    >
  </div>
</template>
