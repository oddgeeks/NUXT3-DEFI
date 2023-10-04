<script lang="ts" setup>
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'
import { ethers } from 'ethers'
import SVGInfo from '~/assets/images/icons/exclamation-circle.svg?component'

const props = defineProps<{
  input: InputType
  index: number
  method?: string
  txBuilder: TransactionBuilder
  modelValue?: any
  root?: boolean
  errorClasses?: string
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
  <div class="rounded-lg border border-gray-800 px-4 py-3">
    <div v-if="input.type === 'tuple'" class="space-y-3">
      <label>{{ input.name }}</label>

      <TransactionBuilderInput
        v-for="(inp, idx) in input.components || []" :key="idx" :input="inp" :index="idx"
        :tx-builder="txBuilder"
      />
    </div>
    <div v-else-if="input.type.includes('[]')" class="space-y-3">
      <label>{{ input.name }} (array)</label>

      <TransactionBuilderInputArray :key="input.type" :index="index" :input="input" :tx-builder="txBuilder" />
    </div>
    <div v-else-if="input.type === 'bool'" class="my-3 flex">
      <label>{{ input.name }}</label>
      <CommonToggle text="" @update="onInput($event.target.value)" />
    </div>
    <div v-else class="space-y-3">
      <label>{{ input.name }}</label>

      <CommonInput :placeholder="input.type" @input="onInput($event.target.value)" />

      <span v-if="error" :class="errorClasses" class="mt-2 flex items-center gap-2 text-left text-xs text-red-alert">
        <SVGInfo class="shrink-0" />
        {{ error }}
      </span>
    </div>
  </div>
</template>
