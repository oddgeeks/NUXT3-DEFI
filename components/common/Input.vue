<script setup lang="ts">
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null | undefined | unknown
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

const emit = defineEmits(['update:modelValue', 'inputFocus', 'inputBlur', 'beforeinput'])

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
  emit('beforeinput', e)
}
</script>

<template>
  <div>
    <div
      :class="[
        containerClasses,
        {
          '!ring-2 !ring-red-alert': !!errorMessage && errorType === 'error',
          '!ring-2 !ring-orange-500': !!errorMessage && errorType === 'warning',
        },
        transparent
          ? 'bg-transparent'
          : 'bg-gray-900 focus-within:bg-gray-850 focus-within:ring-1 focus-within:ring-slate-750',
      ]"
      class="relative flex items-center rounded-10 px-5 focus-within:outline-none"
    >
      <slot name="prefix" />
      <slot name="input">
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
          class="common-input"
          :class="[inputClasses]"
          @beforeinput="handleBeforeInput"
          @input="handleInput"
          @focus="$emit('inputFocus')"
          @blur="$emit('inputBlur')"
        >
      </slot>

      <slot name="suffix" />
    </div>
    <span
      v-if="!!errorMessage"
      class="mt-2 flex items-center gap-2 text-left text-xs"
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
