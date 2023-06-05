<script setup lang="ts">
import type { CurrencyInputOptions } from 'vue-currency-input'
import { useCurrencyInput } from 'vue-currency-input'

const props = defineProps<{
  modelValue: number
  options?: CurrencyInputOptions
}>()

const { inputRef } = useCurrencyInput({
  currency: 'usd',
  ...props.options || {},
})
</script>

<template>
  <input
    ref="inputRef"
    class="bg-transparent p-0 outline-none border-0 font-medium focus:border-0 focus:ring-0"
    type="text"
  >
</template>
