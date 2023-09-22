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
  <div class="px-7.5 max-w-[820px] flex gap-7.5 w-full">
    <label class="text-sm font-medium text-slate-400 w-[180px] shrink-0">Params</label>
    <CommonTextarea v-model="value" :error-message="errorMessage" name="params" rows="5" placeholder="Enter valid json" />
  </div>
</template>
