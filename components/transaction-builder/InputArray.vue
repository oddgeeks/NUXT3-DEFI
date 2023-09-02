<script lang="ts" setup>
import type { StructType, TransactionBuilder } from '@instadapp/transaction-builder'

type InputType = ReturnType<TransactionBuilder['getMethodInputs']>[number]
const props = defineProps<{
  input: InputType | StructType
  index: number
  method?: string
  txBuilder: TransactionBuilder
  modelValue?: any
  root?: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const newType = props.input.type.replace('[]', '')
const error = ref('')
</script>

<template>
  <div class="space-y-4">
    <CommonInput :placeholder="newType" />
    <CommonInput :placeholder="newType" />
    <CommonInput :placeholder="newType" />
    <CommonInput :placeholder="newType" />
  </div>
</template>
