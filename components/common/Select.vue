<script lang="ts" setup>
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";
import SVGSuccess from "~/assets/images/icons/check-circle.svg?component";

const [open, toggle] = useToggle(false);

const containerRef = ref(null);

const emit = defineEmits(["update:modelValue"]);
const props = defineProps<{
  options: any[];
  labelKey?: string;
  valueKey?: string;
  iconKey?: string;
  isValueIndex?: boolean;
  modelValue?: any;
}>();

onClickOutside(containerRef, () => {
  toggle(false);
});

const selected = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const selectedLabel = computed(() => {
  const option = props.options.find(
    (o, i) => getValue(o, i) == props.modelValue
  );
  return option ? getLabel(option) : null;
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

const getIcon = (option: any) => {
  if (props.iconKey && option) return option[props.iconKey];
  return null;
};

const selectedIcon = computed(() => {
  let option;
  if (props.isValueIndex) option = props.options[props.modelValue];
  else
    option = props.options.find((o, i) => getValue(o, i) == props.modelValue);
  return getIcon(option);
});

const setSelected = (option: any, index: number) => {
  selected.value = getValue(option, index);
  toggle(false);
};

const isSelected = (option: any, index: number) => {
  return getValue(option, index) == props.modelValue;
};
</script>

<template>
  <div @keydown.escape="toggle(false)" ref="containerRef" class="relative z-10">
    <button
      ref="button"
      @click="toggle()"
      :class="{ 'border-b-transparent rounded-b-none adjuster': open }"
      class="relative w-full flex items-center gap-2.5 rounded-2xl border-2 border-slate-700 bg-gray-850 px-4 py-2.5 text-left"
    >
      <img class="w-6 h-6" v-if="iconKey && selectedIcon" :src="selectedIcon" />
      <span class="block truncate">{{ selectedLabel }}</span>
      <span class="pointer-events-none flex items-center ml-auto">
        <ChevronDownSVG class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </span>
    </button>
    <transition
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <ul
        v-if="open"
        class="absolute w-full flex flex-col gap-1.5 px-1 py-[15px] max-h-60 border-2 border-slate-700 border-t-0 rounded-b-2xl overflow-auto bg-gray-850"
      >
        <li
          v-for="(option, i) in options"
          :key="i"
          class="text-left text-sm hover:bg-slate-800 rounded-[14px]"
          :class="{ 'bg-slate-800': isSelected(option, i) }"
        >
          <button
            @click="setSelected(option, i)"
            class="w-full flex gap-2.5 items-center text-left py-3 px-3"
          >
            <img
              class="w-6 h-6"
              v-if="iconKey && getIcon(option)"
              :src="getIcon(option)"
            />
            {{ getLabel(option) }}
            <SVGSuccess
              v-if="isSelected(option, i)"
              class="selected w-5 h-5 shrink-0 ml-auto text-white"
            />
          </button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.selected :deep(path):first-child {
  @apply fill-green-400 stroke-green-400;
}

.adjuster:before {
  content: "";
  position: absolute;
  left: -2px;
  bottom: -2px;
  width: 2px;
  height: 2px;
  @apply bg-slate-700;
}

.adjuster:after {
  content: "";
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 2px;
  height: 2px;
  @apply bg-slate-700;
}
</style>
