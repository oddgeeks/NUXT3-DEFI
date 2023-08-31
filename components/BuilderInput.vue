<script setup lang="ts">
import type { TransactionBuilder } from '@instadapp/transaction-builder'
import { serialize } from 'error-serializer'

import { useField } from 'vee-validate'

const props = defineProps<{
  input: any
  method: string
  builder: TransactionBuilder
}>()

const { value, errorMessage } = useField<any>(() => props.input.name, (val) => {
  try {
    props.builder.validateMethodInput(props.method, props.input.name, val)
  }
  catch (e) {
    const parsed = serialize(e)
    return parsed.message
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
