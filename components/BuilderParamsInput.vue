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
  <div class="flex w-full max-w-[820px] gap-7.5 px-7.5">
    <label class="w-[180px] shrink-0 text-sm font-medium text-slate-400">Params</label>
    <CommonTextarea v-model="value" :error-message="errorMessage" name="params" rows="5" placeholder="Enter valid json" />
  </div>
</template>
