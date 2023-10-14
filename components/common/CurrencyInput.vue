<script setup lang="ts">
import type { CurrencyInputOptions } from 'vue-currency-input'
import { useCurrencyInput } from 'vue-currency-input'

const props = defineProps<{
  modelValue: number
  options?: CurrencyInputOptions
  styled?: boolean
  autofocus?: boolean
  inputClasses?: string
  dirty?: boolean
}>()

const { inputRef, setValue } = useCurrencyInput({
  currency: 'USD',
  locale: 'en-US',
  currencyDisplay: 'symbol' as any,
  hideCurrencySymbolOnFocus: false,
  hideGroupingSeparatorOnFocus: true,
  hideNegligibleDecimalDigitsOnFocus: true,
  autoDecimalDigits: false,
  useGrouping: true,
  accountingSign: false,
  ...props.options || {},
})

watch(() => props.dirty, () => {
  setValue(props.modelValue)
})
</script>

<template>
  <CommonInput v-if="styled">
    <template #input>
      <input
        ref="inputRef"
        v-focus="{ enabled: autofocus }"
        v-bind="$attrs"
        :class="inputClasses"
        class="common-input"
        type="text"
      >
    </template>
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot v-if="slotProps" :name="name" v-bind="slotProps" />
      <slot v-else :name="name" />
    </template>
  </CommonInput>
  <input
    v-else
    ref="inputRef"
    v-bind="$attrs"
    class="border-0 bg-transparent p-0 font-medium outline-none focus:border-0 focus:ring-0"
    type="text"
  >
</template>
