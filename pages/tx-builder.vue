<script setup lang="ts">
import { TransactionBuilder } from '@instadapp/transaction-builder'
import { useForm } from 'vee-validate'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const method = ref()
const ABI = ref()

function isJsonString(str: string) {
  try {
    JSON.parse(str)
  }
  catch (e) {
    return false
  }
  return true
}

const builder = computed(() => isJsonString(ABI.value) ? new TransactionBuilder(JSON.parse(JSON.stringify(ABI.value))) : null)

const { handleSubmit } = useForm()

const onSubmit = handleSubmit(async (values) => {
  console.log(values)
})
</script>

<template>
  <div class="flex-1 relative">
    <div class="max-w-lg">
      <h1 class="mb-4">
        New Transaction
      </h1>

      <div class="flex flex-col gap-4">
        <CommonInput placeholder="Enter Address or ENS Name" />

        <textarea v-model="ABI" rows="5" placeholder="Enter ABI" class="dark:bg-slate-800  bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100" />
        <template v-if="builder">
          <label for="">Write Methods</label>
          <select v-model="method" class="dark:bg-slate-800  bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100">
            <option v-for="item in builder?.getWriteMethods()" :key="item">
              {{ item }}
            </option>
          </select>
        </template>

        <template v-if="builder && method">
          <form @submit="onSubmit">
            <BuilderInput v-for="input in builder.getMethodInputs(method)" :key="input.name" :method="method" :builder="builder" :input="input" />
            <button>
              submit ulan
            </button>
          </form>
        </template>
      </div>
    </div>
  </div>
</template>
