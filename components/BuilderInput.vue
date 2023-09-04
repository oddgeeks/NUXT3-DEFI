<script setup lang="ts">
import type { TransactionBuilder } from '@instadapp/transaction-builder'
import { serialize } from 'error-serializer'

import { useField } from 'vee-validate'

const props = defineProps<{
  input: any
  method: string
  builder: TransactionBuilder
}>()

function safeParse(s: string) {
  try {
    return JSON.parse(s)
  }
  catch (e) {
    return s
  }
}

const { value, errorMessage } = useField<any>(() => props.input.name, (val) => {
  const isInputTypeArray = props.input.type.includes('[]')

  val = safeParse(val)

  if (isInputTypeArray && !Array.isArray(val))
    return 'input must be an array'

  try {
    props.builder.validateMethodInput(props.method, props.input.name, val)
    return true
  }
  catch (e) {
    const parsed = serialize(e)

    return parsed?.reason || parsed.message
  }
})
</script>

<template>
  <div>
    <label class="text-sm mb-2 block">
      {{ input.name }} ({{ input.type }})
    </label>
    <CommonInput v-model="value" :error-message="errorMessage" :name="input.name" />
  </div>
</template>
