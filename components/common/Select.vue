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
  listClasses?: string
  disabled?: boolean
  searchable?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const [open, toggle] = useToggle(false)

const containerRef = ref(null)
const search = ref('')

onClickOutside(containerRef, () => {
  toggle(false)
})

const actualOptions = computed(() => {
  if (props.searchable && !!search.value)
    return props.options.filter(o => getLabel(o).toLowerCase().includes(search.value.toLowerCase()))

  return props.options
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

whenever(open, () => {
  search.value = ''
})
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
        { 'adjuster rounded-b-none border-b-transparent': open },
        containerClasses,
      ]"
      class="relative flex max-h-12 w-full items-center gap-2.5 rounded-[14px] border-1 border-slate-150 bg-slate-50 px-[14px] py-3 text-left dark:border-slate-700 dark:bg-gray-850"
      @click="toggle()"
    >
      <slot name="button-prefix">
        <img
          v-if="iconKey && selectedIcon"
          class="h-6 w-6"
          :src="selectedIcon"
        >
      </slot>
      <slot name="button-label">
        <span :class="selectedLabelClasses" class="block truncate text-sm">{{
          selectedLabel
        }}
        </span>
      </slot>

      <slot name="button-suffix" />
      <span v-if="!disabled" class="pointer-events-none ml-auto flex items-center">
        <ChevronDownSVG class="h-5 w-5 text-gray-400" aria-hidden="true" />
      </span>
    </button>
    <transition
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open">
        <ul
          :class="listClasses"
          class="absolute flex max-h-60 w-full flex-col gap-1.5 overflow-auto rounded-b-[14px] border-1 border-t-0 border-slate-150 bg-slate-50 px-1 py-[15px] dark:border-slate-700 dark:bg-gray-850"
        >
          <CommonInput v-if="searchable" v-model="search" autofocus placeholder="Search" name="search-input" class="-mt-3 !p-2" input-classes="!py-2" type="search" />
          <li
            v-for="(option, i) in actualOptions"
            :key="i"
            class="rounded-[14px] text-left text-sm hover:bg-slate-100 hover:dark:bg-slate-800"
            :class="{ 'bg-slate-100 dark:bg-slate-800': isSelected(option, i) }"
          >
            <button
              type="button"
              :class="itemWrapperClasses"
              class="flex w-full items-center gap-2.5 p-3 text-left"
              @click="setSelected(option, i)"
            >
              <slot :value="getValue(option, i)" name="item-prefix">
                <img
                  v-if="iconKey && getIcon(option)"
                  class="h-6 w-6"
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
                class="selected ml-auto h-5 w-5 shrink-0 text-white"
              />
            </button>
          </li>
        </ul>
      </div>
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
  left: -1px;
  bottom: -2px;
  width: 2px;
  height: 2px;
  @apply dark:bg-slate-700 bg-slate-150;
}

.adjuster:after {
  content: "";
  position: absolute;
  right: -1px;
  bottom: -2px;
  width: 2px;
  height: 2px;
  @apply dark:bg-slate-700 bg-slate-150;
}
</style>
