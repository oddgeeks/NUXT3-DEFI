<script setup lang="ts">
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'
import { useFieldArray } from 'vee-validate'

const props = defineProps<{
  input: InputType
  method: string
  builder: TransactionBuilder
}>()

const actualComponents = computed(() => {
  if (props.input.baseType === 'array' && !props.input.components?.length) {
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

const { fields } = useFieldArray('components')
</script>

<template>
  <div class="flex flex-col gap-2">
    {{ fields }}
    <template v-if="actualComponents && actualComponents.length > 0">
      <template v-for="field in fields" :key="field">
        <BuilderInput v-for="i in actualComponents" :key="i.name" :builder="builder" :method="method" :input="i" />
      </template>
    </template>

    <BuilderInput v-else :builder="builder" :method="method" :input="input" />
  </div>
</template>
