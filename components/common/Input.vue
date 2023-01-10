<script setup lang="ts">
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null | undefined;
    placeholder: string;
    inputClasses?: string;
    containerClasses?: string;
    name: string;
    errorMessage?: string;
    type?: string;
    inputmode?: "text" | "decimal" | "numeric";
    errorType?: "error" | "warning";
    step?: string;
    min?: string;
    transparent?: boolean;
    readonly?: boolean;
  }>(),
  {
    placeholder: "",
    name: "",
    type: "text",
    errorType: "error",
    errorMessage: "",
    transparent: false,
    readonly: false,
  }
);

const emit = defineEmits(["update:modelValue"]);

const val = computed({
  get() {
    return props.modelValue || "";
  },
  set(newValue) {
    emit("update:modelValue", newValue);
  },
});
</script>

<template>
  <div>
    <div
      :class="[
        containerClasses,
        {
          '!ring-red-alert !ring-2' : !!errorMessage && errorType === 'error',
          '!ring-orange-500 !ring-2' : !!errorMessage && errorType === 'warning',
        },
        transparent
          ? 'bg-transparent'
          : 'dark:bg-slate-800  bg-slate-100 focus-within:ring-2 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100',
      ]"
      class="relative flex items-center focus-within:outline-none px-5 rounded-[15px]"
    >
      <slot name="prefix" />
      <input
        :readonly="readonly"
        :placeholder="placeholder"
        :type="type"
        :step="step"
        :inputmode="inputmode"
        :name="name"
        v-model="val"
        :min="min"
        class="placeholder-slate-400 placeholder:text-sm border-none shadow-none focus:ring-0 focus:border-none bg-inherit rounded-[inherit] px-0 py-[13px] w-full"
        :class="[inputClasses]"
      />
      <slot name="suffix" />
    </div>
    <span
      class="text-xs flex gap-2 items-center text-left mt-2"
      :class="{
        'text-red-alert': errorType === 'error',
        'text-orange-500': errorType === 'warning',
      }"
      v-if="!!errorMessage"
    >
      <SVGInfo />
      {{ errorMessage }}</span
    >
  </div>
</template>
