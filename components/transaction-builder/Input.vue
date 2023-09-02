<script lang="ts" setup>
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'
import { ethers } from 'ethers'

const props = defineProps<{
  input: InputType
  index: number
  method?: string
  txBuilder: TransactionBuilder
  modelValue?: any
  root?: boolean
}>()
const emit = defineEmits(['update:modelValue'])
const error = ref('')

function onInput(value: any) {
  error.value = ''
  if (!value)
    return

  try {
    if (props.method)
      props.txBuilder.validateMethodInput(props.method, props.input.name || props.index, value)

    else
      ethers.utils.defaultAbiCoder.encode([props.input.type], [value])

    emit('update:modelValue', value)
  }
  catch (e: any) {
    error.value = e.reason || e.message
  }
}
</script>

<template>
  <div class="border px-4 py-3 rounded-lg border-gray-500">
    <div v-if="input.type === 'tuple'" class="space-y-3">
      <label>{{ input.name }}</label>

      <TransactionBuilderInput
        v-for="(inp, idx) in input.components || []" :key="idx" :input="inp" :index="idx"
        :tx-builder="txBuilder"
      />
    </div>
    <div v-else-if="input.type.includes('[]')" class="space-y-3">
      <label>{{ input.name }}</label>

      <TransactionBuilderInputArray :key="input.type" :index="index" :input="input" :tx-builder="txBuilder" />
    </div>
    <div v-else-if="input.type === 'bool'" class="flex my-3">
      <label>{{ input.name }}</label>
      <CommonToggle text="" @update="onInput($event.target.value)" />
    </div>
    <div v-else class="space-y-3">
      <label>{{ input.name }}</label>

      <CommonInput :placeholder="input.type" @input="onInput($event.target.value)" />

      <p v-if="error" class="text-sm text-red-alert">
        {{ error }}
      </p>
    </div>
  </div>
</template>
