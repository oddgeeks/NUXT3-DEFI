<script lang="ts" setup>
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'

const props = defineProps<{
  input: InputType
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
</script>

<template>
  <div class="space-y-4">
    <div>
      <TransactionBuilderInput
        :input="{ ...newInputShape, name: `${newInputShape.name} 0` }" :index="0"
        :tx-builder="txBuilder"
      />
    </div>

    <hr class="my-5 border-slate-150 dark:border-gray-800">

    <div>
      <TransactionBuilderInput
        :input="{ ...newInputShape, name: `${newInputShape.name} 1` }" :index="0"
        :tx-builder="txBuilder"
      />
    </div>

    <hr class="my-5 border-slate-150 dark:border-gray-800">

    <div>
      <TransactionBuilderInput
        :input="{ ...newInputShape, name: `${newInputShape.name} 2` }" :index="0"
        :tx-builder="txBuilder"
      />
    </div>

    <!-- ... -->
  </div>
</template>
