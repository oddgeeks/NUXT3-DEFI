<script setup lang="ts">
import type { InputType, TransactionBuilder } from '@instadapp/transaction-builder'

const props = defineProps<{
  input: InputType
  method: string
  builder: TransactionBuilder
  index?: number
  value?: any
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

const hasActualComponents = computed(() => actualComponents.value && actualComponents.value.length > 0)
</script>

<template>
  <div class="flex w-full flex-col gap-2">
    <ul v-if="hasActualComponents" class="tree flex flex-col gap-3">
      <fieldset v-if="input.type === 'tuple'" :class="index === undefined ? 'pl-9' : 'gap-9'" class="flex w-full">
        <div class="flex h-[30px] shrink-0 items-center text-sm font-medium text-gray-400">
          {{ input.name }} ({{ input.type }})
        </div>
        <div class="flex-1 space-y-4">
          <BuilderViewer
            v-for="i in actualComponents"
            :key="i.name"
            :builder="builder"
            :method="method"
            :index="index"
            :input="i"
            :value="value[i.name || '']"
          />
        </div>
      </fieldset>
      <template v-else-if="Array.isArray(value)">
        <li v-for="_, t in value" :key="t" class="relative flex w-full flex-col gap-5">
          <template
            v-for="i in actualComponents"
            :key="i.name + t"
          >
            <BuilderViewer
              :builder="builder"
              :method="method"
              :index="t"
              :input="i"
              :value="value[t][i.name!] || value[t]"
            />
          </template>
        </li>
      </template>
    </ul>

    <div v-else :class="index === undefined ? 'pl-9 max-w-[580px]' : ''" class="flex gap-7.5">
      <label class="flex h-[30px] w-[180px] shrink-0 items-center text-sm font-medium text-gray-400">
        {{ input.name }} ({{ input.type }})
      </label>
      <div style="word-break: break-all;" class="flex items-center text-sm">
        {{ value?.type === 'BigNumber' ? toBN(value) : value }}
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
