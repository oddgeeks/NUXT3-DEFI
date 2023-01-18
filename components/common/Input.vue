<script setup lang="ts">
import BigNumber from "bignumber.js";
import SVGInfo from "~/assets/images/icons/exclamation-circle.svg?component";

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null | undefined;
    placeholder: string;
    inputClasses?: string;
    containerClasses?: string;
    name: string;
    errorMessage?: string;
    type?: "text" | "number" | "numeric" | "password" | "email" | "tel" | "url" | "search";
    errorType?: "error" | "warning";
    step?: string;
    min?: string;
    transparent?: boolean;
    readonly?: boolean;
    autofocus?: boolean;
  }>(),
  {
    modelValue: "",
    placeholder: "",
    name: "",
    type: "text",
    errorType: "error",
    errorMessage: "",
    transparent: false,
    readonly: false,
    autofocus: false,
  }
);

const seperator = ".";
const emit = defineEmits(["update:modelValue"]);

const htmlInputType = computed(() => {
  if (props.type === "numeric") {
    return "text";
  }
  return props.type;
});

const handleInput = (e: any) => {
  let inputVal = e.target.value;

  if (props.type === "numeric") {
    inputVal = inputVal.replace(",", ".");
  }

  emit("update:modelValue", inputVal);
};

const handleBeforeInput = (e: any) => {
  if (props.type === "numeric") {
    let key = (e.data || "").replace(",", ".");
    const computedValue = props.modelValue + (key || "");

    const isValueEmpty = !props.modelValue;
    const isSeperator = seperator === key;
    const hasSeperator = String(props.modelValue).includes(seperator);

    if (isSeperator && isValueEmpty) {
      return e.preventDefault();
    }

    if (hasSeperator && isSeperator) {
      return e.preventDefault();
    }

    // check key is number
    if (key && toBN(key).isNaN() && key !== seperator) {
      return e.preventDefault();
    }

    if (key && toBN(computedValue).isNaN()) {
      return e.preventDefault();
    }
  }
};
</script>

<template>
  <div>
    <div
      :class="[
        containerClasses,
        {
          '!ring-red-alert !ring-2': !!errorMessage && errorType === 'error',
          '!ring-orange-500 !ring-2': !!errorMessage && errorType === 'warning',
        },
        transparent
          ? 'bg-transparent'
          : 'dark:bg-slate-800  bg-slate-100 focus-within:ring-2 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100',
      ]"
      class="relative flex items-center focus-within:outline-none px-5 rounded-[15px]"
    >
      <slot name="prefix" />
      <input
        autocomplete="off"
        :readonly="readonly"
        :type="htmlInputType"
        @beforeinput="handleBeforeInput"
        @input="handleInput"
        :value="modelValue"
        :placeholder="placeholder"
        :step="step"
        :name="name"
        v-focus="{ enabled: autofocus }"
        :min="min"
        class="placeholder-slate-400 focus-visible:!outline-none placeholder:text-sm border-none shadow-none focus:ring-0 focus:border-none bg-inherit rounded-[inherit] px-0 py-[13px] w-full"
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
