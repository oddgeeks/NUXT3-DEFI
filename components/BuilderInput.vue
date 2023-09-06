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

const mode = inject<Ref<TxBuilderModes>>('mode')

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

const hasActualComponents = computed(() => actualComponents.value && actualComponents.value.length > 0)

function getInputName(index?: number, fieldIndex?: string | number) {
  if (isArr.value && !props.input.components?.length && index !== undefined)
    return `${props.name}[${index}]`

  let base = props.name

  if (index !== undefined)
    base += `[${index}]`

  if (fieldIndex !== undefined)
    base += `[${fieldIndex}]`

  return base
}

const { fields = [], push = () => {}, remove = () => {} } = mode?.value === 'super-collapse'
  ? {} as any
  : hasActualComponents.value && mode?.value === 'expand'
    ? useFieldArray(props.name)
    : {}

const { value, errorMessage, name } = useField<any>(() => {
  if (mode?.value === 'super-collapse')
    return ''

  if (hasActualComponents.value && mode?.value === 'expand')
    return ''
  return props.name
}, (val) => {
  if (mode?.value === 'super-collapse')
    return true

  if (hasActualComponents.value && mode?.value === 'expand')
    return true

  const parsed = tryJsonParse(val)

  const isNumb = typeof parsed === 'number' && !isNaN(parsed)

  try {
    ethers.utils.defaultAbiCoder.encode([props.input.type], [isNumb ? String(parsed) : parsed])
    return true
  }
  catch (e) {
    const parsed = serialize(e)

    return parsed?.reason || parsed.message
  }
})

watchThrottled(mode!, () => {
  if (isArr.value && !fields.value?.length)
    push(undefined)
}, {
  immediate: true,
  throttle: 500,
})
</script>

<template>
  <div class="flex flex-col gap-2">
    <div v-if="hasActualComponents && mode === 'expand'" class="flex flex-col gap-4 rounded-lg">
      <template v-if="input.type === 'tuple'">
        <BuilderInput
          v-for="i, k in actualComponents"
          :key="i.name"
          :builder="builder"
          :method="method"
          :input="i"
          :name="getInputName(undefined, k)"
        />
      </template>
      <template v-else>
        <div v-for="_, t in fields" :key="t" class="relative rounded-lg ring-1 p-4">
          <button v-if="t === 0" class="w-5 absolute right-2 top-0 h-5 flex items-center justify-center self-end bg-primary rounded-full" type="button" @click="push(undefined)">
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
        {{ input.name }} ({{ input.type }})
      </label>
      <CommonToggle v-if="input.type === 'bool'" v-model="value" :name="name" />
      <CommonInput v-else v-model="value" :error-message="errorMessage" :name="name" />
    </template>
  </div>
</template>
