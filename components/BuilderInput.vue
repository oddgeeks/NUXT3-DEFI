<script setup lang="ts">
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'
import { serialize } from 'error-serializer'
import { ethers } from 'ethers'

import { useField, useFieldArray } from 'vee-validate'

const props = defineProps<{
  input: InputType
  method: string
  builder: TransactionBuilder
  name: string
}>()

const isArr = computed(() => props.input.type.includes('[]'))

const actualComponents = computed(() => {
  if (isArr.value && !props.input.components?.length) {
    const type = props.input.type.replace('[]', '')
    return [
      {
        baseType: type,
        type,
        name: props.input.name,
        components: [],
      },
    ]
  }
  else {
    return props.input.components
  }
})

const actualType = computed(() => props.input.type.replace('[]', ''))

function getInputName(index?: number, fieldIndex?: string | number) {
  let base = props.name

  if (index !== undefined)
    base += `[${index}]`

  if (fieldIndex !== undefined)
    base += `[${fieldIndex}]`

  return base
}

const { fields, push, remove } = useFieldArray(props.input.type)

const { value, errorMessage } = actualComponents.value && actualComponents.value.length > 0
  ? ({ value: undefined, errorMessage: '' })
  : useField<any>(() => props.name, (val) => {
    try {
      ethers.utils.defaultAbiCoder.encode([props.input.type], [val])
      return true
    }
    catch (e) {
      const parsed = serialize(e)

      return parsed?.reason || parsed.message
    }
  })

onMounted(() => {
  if (isArr.value && !fields.value.length)
    push({})
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="actualComponents && actualComponents.length > 0" class="flex flex-col gap-4 rounded-lg">
      <template v-if="input.type === 'tuple'">
        <BuilderInput
          v-for="i in actualComponents"
          :key="i.name"
          :builder="builder"
          :method="method"
          :input="i"
          :name="getInputName(undefined, i.type)"
        />
      </template>
      <template v-else>
        <div v-for="field, t in fields" :key="t" class="relative rounded-lg ring-1 p-4">
          <button v-if="t === 0" class="w-5 absolute right-2 top-0 h-5 flex items-center justify-center self-end bg-primary rounded-full" type="button" @click="push({})">
            <SvgoPlus />
          </button>
          <button v-else class="w-5 absolute right-2 top-0 h-5 flex items-center justify-center self-end bg-red-alert rounded-full" type="button" @click="remove(t)">
            -
          </button>

          <template
            v-for="i, k in actualComponents"
            :key="i.name"
          >
            <BuilderInput
              :builder="builder"
              :method="method"
              :name="getInputName(t, k)"
              :input="i"
            />
          </template>
        </div>
      </template>
    </div>

    <template v-else>
      <label class="text-sm mb-2 block">
        {{ input.name }} ({{ actualType }})
      </label>
      <CommonToggle v-if="actualType === 'bool'" v-model="value" :name="name" />
      <CommonInput v-else v-model="value" :error-message="errorMessage" :name="name" />
    </template>
  </div>
</template>
