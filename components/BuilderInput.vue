<script setup lang="ts">
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'
import { serialize } from 'error-serializer'
import { ethers } from 'ethers'

import { useField, useFieldArray } from 'vee-validate'

const props = defineProps<{
  input: InputType
  method: string
  builder: TransactionBuilder
  name?: string
  index?: number
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
  : hasActualComponents.value && mode?.value === 'expand' && props.name
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
    <ul v-if="hasActualComponents && mode === 'expand'" class="tree flex flex-col gap-4 max-w-[580px]">
      <template v-if="input.type === 'tuple'">
        <BuilderInput
          v-for="i, k in actualComponents"
          :key="i.name"
          :builder="builder"
          :method="method"
          :index="index"
          :input="i"
          :name="getInputName(undefined, k)"
        />
      </template>
      <template v-else>
        <li v-for="_, t in fields" :key="t" class="relative flex flex-col gap-5">
          <button v-if="fields.length > 1" class="text-slate-400 absolute -right-6 top-4" type="button" @click="remove(t)">
            <SvgoX />
          </button>
          <template
            v-for="i, k in actualComponents"
            :key="i.name + t"
          >
            <BuilderInput
              :builder="builder"
              :method="method"
              :index="t"
              :name="getInputName(t, k)"
              :input="i"
            />
          </template>
        </li>
        <li>
          <button class="w-10 h-10 flex items-center justify-center bg-opacity-10 bg-primary rounded-full" type="button" @click="push(undefined)">
            <SvgoPlus class="text-primary" />
          </button>
        </li>
      </template>
    </ul>

    <div v-else :class="index === undefined ? 'px-9 max-w-[580px]' : ''" class="flex items-center gap-7.5 w-full">
      <label class="text-sm font-medium text-slate-400 w-[200px] shrink-0" :for="`input-${name}`">
        {{ input.name }} ({{ input.type }})
      </label>
      <div class="w-full flex items-center">
        <CommonToggle v-if="input.type === 'bool'" v-model="value" :name="name" />
        <CommonInput v-else v-model="value" class="w-full" error-classes="max-w-sm" :error-message="errorMessage" :name="name" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tree {
  --spacing : 1.5rem;
  --radius  : 10px;
}
.tree > li{
  position     : relative;
  padding-left : calc(2 * var(--spacing) - var(--radius) - 2px);
}
</style>
