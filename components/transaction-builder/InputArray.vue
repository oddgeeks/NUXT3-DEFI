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
const newInputShape = {
  ...props.input,
  type: props.input.type.replace('[]', ''),
}
const error = ref('')
</script>

<template>
  <div class="space-y-4">
    <div>
      <TransactionBuilderInput
        :input="newInputShape" :index="0"
        :tx-builder="txBuilder"
      />
    </div>

    <hr class="border-slate-150 dark:border-slate-800 my-5">

    <div>
      <TransactionBuilderInput
        :input="newInputShape" :index="0"
        :tx-builder="txBuilder"
      />
    </div>
  </div>
</template>
