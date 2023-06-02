<script lang="ts" setup>
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'
import SVGSuccess from '~/assets/images/icons/check-circle.svg?component'

const props = defineProps<{
  options: any[]
  labelKey?: string
  valueKey?: string
  iconKey?: string
  isValueIndex?: boolean
  modelValue?: any
  containerClasses?: string
  itemTextClasses?: string
  itemWrapperClasses?: string
  selectedLabelClasses?: string
  disabled?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const [open, toggle] = useToggle(false)

const containerRef = ref(null)

onClickOutside(containerRef, () => {
  toggle(false)
})

const selected = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const selectedLabel = computed(() => {
  const option = props.options.find(
    (o, i) => getValue(o, i) == props.modelValue,
  )
  return option ? getLabel(option) : null
})

function getLabel(option: any) {
  if (props.labelKey)
    return option[props.labelKey]
  return option
}

function getValue(option: any, index?: number) {
  if (props.isValueIndex)
    return index
  if (props.valueKey)
    return option[props.valueKey]
  return option
}

function getIcon(option: any) {
  if (props.iconKey && option)
    return option[props.iconKey]
  return null
}

const selectedIcon = computed(() => {
  let option
  if (props.isValueIndex)
    option = props.options[props.modelValue]
  else
    option = props.options.find((o, i) => getValue(o, i) == props.modelValue)
  return getIcon(option)
})

function setSelected(option: any, index: number) {
  selected.value = getValue(option, index)
  toggle(false)
}

function isSelected(option: any, index: number) {
  return getValue(option, index) == props.modelValue
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative"
    :class="{ 'z-10': open, 'pointer-events-none': disabled }"
    @keydown.escape="toggle(false)"
  >
    <button
      type="button"
      :class="[
        { 'border-b-transparent rounded-b-none adjuster': open },
        containerClasses,
      ]"
      class="relative w-full flex items-center gap-2.5 max-h-12 rounded-2xl border-2 dark:border-slate-700 border-slate-150 bg-slate-50 dark:bg-gray-850 px-4 py-3 text-left"
      @click="toggle()"
    >
      <slot name="button-prefix">
        <img
          v-if="iconKey && selectedIcon"
          class="w-6 h-6"
          :src="selectedIcon"
        >
      </slot>
      <span :class="selectedLabelClasses" class="block truncate text-sm">{{
        selectedLabel
      }}</span>
      <span v-if="!disabled" class="pointer-events-none flex items-center ml-auto">
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
        class="absolute w-full flex flex-col gap-1.5 px-1 py-[15px] max-h-60 border-2 dark:border-slate-700 border-slate-150 border-t-0 rounded-b-2xl overflow-auto bg-slate-50 dark:bg-gray-850"
      >
        <li
          v-for="(option, i) in options"
          :key="i"
          class="text-left text-sm hover:dark:bg-slate-800 hover:bg-slate-100 rounded-[14px]"
          :class="{ 'dark:bg-slate-800 bg-slate-100': isSelected(option, i) }"
        >
          <button
            type="button"
            :class="itemWrapperClasses"
            class="w-full flex gap-2.5 items-center text-left py-3 px-3"
            @click="setSelected(option, i)"
          >
            <slot :value="getValue(option, i)" name="item-prefix">
              <img
                v-if="iconKey && getIcon(option)"
                class="w-6 h-6"
                :src="getIcon(option)"
              >
            </slot>
            <slot
              :label="getLabel(option)"
              :value="getValue(option, i)"
              :item="option"
              name="item"
            >
              <span :class="itemTextClasses">{{ getLabel(option) }}</span>
            </slot>
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
  @apply dark:bg-slate-700 bg-slate-150;
}

.adjuster:after {
  content: "";
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 2px;
  height: 2px;
  @apply dark:bg-slate-700 bg-slate-150;
}
</style>
