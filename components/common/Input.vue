<script setup lang="ts">
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null | undefined
    placeholder?: string
    inputClasses?: string
    containerClasses?: string
    errorClasses?: string
    disabled?: boolean
    name?: string
    errorMessage?: string
    type?: 'text' | 'number' | 'numeric' | 'password' | 'email' | 'tel' | 'url' | 'search'
    errorType?: 'error' | 'warning'
    step?: string
    min?: string
    transparent?: boolean
    readonly?: boolean
    autofocus?: boolean
    transformer?: (value: string) => string
  }>(),
  {
    modelValue: '',
    placeholder: '',
    name: '',
    type: 'text',
    errorType: 'error',
    errorMessage: '',
    transparent: false,
    readonly: false,
    autofocus: false,
  },
)

const emit = defineEmits(['update:modelValue', 'inputFocus', 'inputBlur'])

const seperator = '.'
const htmlInputType = computed(() => {
  if (props.type === 'numeric')
    return 'text'

  return props.type
})

function handleInput(e: any) {
  let inputVal = e.target.value

  if (props.type === 'numeric')
    inputVal = inputVal.replace(',', '.')

  if (props.transformer)
    inputVal = props.transformer(inputVal)

  emit('update:modelValue', inputVal)
}

function handleBeforeInput(e: any) {
  if (props.type === 'numeric') {
    const key = (e.data || '').replace(',', '.')
    const computedValue = props.modelValue + (key || '')

    const isValueEmpty = !props.modelValue
    const isSeperator = seperator === key
    const hasSeperator = String(props.modelValue).includes(seperator)

    if (isSeperator && isValueEmpty)
      return e.preventDefault()

    if (hasSeperator && isSeperator)
      return e.preventDefault()

    // check key is number
    if (key && toBN(key).isNaN() && key !== seperator)
      return e.preventDefault()

    if (key && toBN(computedValue).isNaN())
      return e.preventDefault()
  }
}
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
          : 'dark:bg-slate-800  bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100',
      ]"
      class="relative flex items-center focus-within:outline-none px-5 rounded-[15px]"
    >
      <slot name="prefix" />
      <input
        :id="`input-${name}`"
        v-focus="{ enabled: autofocus }"
        autocomplete="off"
        :readonly="readonly"
        :type="htmlInputType"
        :value="modelValue"
        :placeholder="placeholder"
        :step="step"
        :name="name"
        :disabled="disabled"
        :min="min"
        class="placeholder-slate-400 focus-visible:!outline-none placeholder:text-sm border-none shadow-none focus:ring-0 focus:border-none bg-inherit rounded-[inherit] px-0 py-[13px] w-full"
        :class="[inputClasses]"
        @beforeinput="handleBeforeInput"
        @input="handleInput"
        @focus="$emit('inputFocus')"
        @blur="$emit('inputBlur')"
      >
      <slot name="suffix" />
    </div>
    <span
      v-if="!!errorMessage"
      class="text-xs flex gap-2 items-center text-left mt-2"
      :class="[
        {
          'text-red-alert': errorType === 'error',
          'text-orange-500': errorType === 'warning',
        },
        errorClasses,
      ]"
    >
      <SVGInfo class="shrink-0" />
      {{ errorMessage }}</span>
  </div>
</template>
