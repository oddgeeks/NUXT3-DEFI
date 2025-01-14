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

const multipiler = ref()
const actualValue = ref()

const mode = inject<Ref<TxBuilderModes>>('mode')

const isTypeInteger = computed(() => mode?.value === 'expand' && props.input.type.includes('int'))

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

const { value, errorMessage, name, setValue } = useField<any>(() => {
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

  const isNumb = typeof parsed === 'number' && !Number.isNaN(parsed)

  try {
    ethers.utils.defaultAbiCoder.encode([props.input.type], [isNumb ? toBN(parsed).toFixed() : parsed])
    return true
  }
  catch (e) {
    const parsed = serialize(e)

    return parsed?.reason || parsed.message
  }
})

function handleInput() {
  actualValue.value = undefined
  multipiler.value = undefined
}

watchThrottled(mode!, () => {
  if (isArr.value && !fields.value?.length)
    push(undefined)
}, {
  immediate: true,
  throttle: 500,
})

watch(multipiler, () => {
  if (!isTypeInteger.value || !multipiler.value)
    return

  if (!actualValue.value)
    actualValue.value = value.value || '1'

  setValue(toWei(actualValue.value, multipiler.value), true)
})

onMounted(() => {
  if (!isTypeInteger.value || !value.value)
    return

  const digit = value.value?.length - 1

  if (digit) {
    multipiler.value = digit
    actualValue.value = fromWei(value.value, digit)
  }
})
</script>

<template>
  <div class="flex w-full max-w-[660px] flex-col gap-2">
    <ul v-if="hasActualComponents && mode === 'expand'" class="tree flex flex-col gap-4">
      <fieldset v-if="input.type === 'tuple'" :class="index === undefined ? 'pl-9' : 'gap-9'" class="flex w-full">
        <div class="flex h-[50px] shrink-0 items-center text-sm font-medium text-gray-400">
          {{ input.name }} ({{ input.type }})
        </div>
        <div class="flex-1 space-y-4">
          <BuilderInput
            v-for="i, k in actualComponents"
            :key="i.name"
            :builder="builder"
            :method="method"
            :index="index"
            :input="i"
            :name="getInputName(undefined, k)"
          />
        </div>
      </fieldset>
      <template v-else>
        <li v-for="_, t in fields" :key="t" class="relative flex w-full flex-col gap-5">
          <button v-if="fields.length > 1" class="absolute -right-6 top-4 z-[2] text-gray-400" type="button" @click="remove(t)">
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
          <button class="flex h-10 w-10 items-center justify-center rounded-full bg-primary bg-opacity-10" type="button" @click="push(undefined)">
            <SvgoPlus class="text-primary" />
          </button>
        </li>
      </template>
    </ul>

    <div v-else :class="index === undefined ? 'pl-9 max-w-[580px]' : ''" class="flex w-full gap-7.5">
      <label class="flex h-[50px] w-[180px] shrink-0 items-center text-sm font-medium text-gray-400" :for="`input-${name}`">
        {{ input.name }} ({{ input.type }})
      </label>
      <div class="flex w-full items-center">
        <CommonToggle v-if="input.type === 'bool'" v-model="value" :name="name" />
        <div v-else class="w-full">
          <CommonInput v-model="value" class="w-full" error-classes="max-w-sm" :error-message="errorMessage" :name="name" @input="handleInput" />
          <fieldset v-if="isTypeInteger" class="mt-4 flex items-center gap-4">
            <label v-for="i in ['6', '8', '18']" :key="i" class="block w-full" :for="`input-${name}-wei-${i}`">
              <input :id="`input-${name}-wei-${i}`" v-model="multipiler" class="peer sr-only" :value="i" :name="`${name}-wei`" type="radio">
              <div class="flex items-center justify-center rounded-[14px] border border-slate-750 bg-gray-850 px-[14px] py-2.5 text-xs font-medium peer-checked:bg-gray-800">
                10^{{ i }}
              </div>
            </label>
            <CommonInput v-model="multipiler" :name="`${name}-wei-custom`" type="numeric" class="font-medium" container-classes="px-[14px]" input-classes="!py-2.5 text-xs !w-[50px]">
              <template #prefix>
                <span class="pointer-events-none z-0 mr-1 text-xs">
                  10^
                </span>
              </template>
            </CommonInput>
          </fieldset>
        </div>
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
