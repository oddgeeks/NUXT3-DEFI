<script setup lang="ts">
import type { TransactionBuilder } from '@instadapp/transaction-builder'
import { useField } from 'vee-validate'
import { serialize } from 'error-serializer'

const props = defineProps<{
  method: string
  builder: TransactionBuilder
}>()

const { value, errorMessage } = useField<string>('params', (val) => {
  if (!val || !props.builder)
    return false

  const parsed = tryJsonParse(val)

  // check parser is valid object
  if (typeof parsed !== 'object')
    return false

  try {
    props.builder.build(props.method, parsed)
  }
  catch (e) {
    const parsed = serialize(e)

    return parsed?.reason || parsed.message
  }

  return true
})
</script>

<template>
  <div class="w-full">
    <label>Params</label>
    <textarea v-model="value" name="params" rows="5" placeholder="Enter valid json" class="dark:bg-slate-800 w-full bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100" />
    <span
      v-if="!!errorMessage"
      class="text-xs flex gap-2 items-center text-left mt-2 text-red-alert"
    >
      <SvgoInfo2 class="shrink-0" />
      {{ errorMessage }}
    </span>
  </div>
</template>
