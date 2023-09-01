<script setup lang="ts">
import { TransactionBuilder } from '@instadapp/transaction-builder'
import { AbiFetcher } from '@instadapp/utils'
import { isAddress } from 'ethers/lib/utils'
import { useForm } from 'vee-validate'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const method = ref()
const ABI = ref()
const contractAddress = ref()
const pending = ref(false)

const transactions = ref<any>([])

const { data, pending: estimatePending, error } = useEstimatedFee(transactions, ref(137), {
  immediate: true,
})

const { sendTransactions } = useAvocadoSafe()

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

const { handleSubmit, resetForm } = useForm()

const onSubmit = handleSubmit(async (values) => {
  const data = builder.value.build(method.value, Object.values(values).reverse())

  const tx = {
    data,
    value: 0,
    operation: 0,
    target: contractAddress.value,
  }

  const arr = [tx]

  transactions.value = arr.concat(transactions.value)

  resetForm()
})

watchDebounced(contractAddress, async () => {
  if (!isAddress(contractAddress.value))
    return

  try {
    pending.value = true

    const fetcher = new AbiFetcher()

    const selam = await fetcher.get(contractAddress.value, 'polygon')

    ABI.value = JSON.stringify(selam, null, 2)
  }
  finally {
    pending.value = false
  }
}, {
  debounce: 1000,
})

async function handleSendTransaction() {
  const tx = await sendTransactions(transactions.value, 137, undefined, 'others')

  if (tx)
    showPendingTransactionModal(tx, 137)
}
</script>

<template>
  <div class="flex-1 relative">
    <div class="grid grid-cols-2 gap-8">
      <div class="">
        <h1 class="mb-4 flex items-center gap-4">
          New Transaction
          <SvgSpinner v-if="pending" />
        </h1>

        <div class="flex flex-col gap-4">
          <CommonInput v-model="contractAddress" name="contractAddress" placeholder="Enter Address or ENS Name" />

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
              <CommonButton type="submit" class="mt-8">
                Add
              </CommonButton>
            </form>
          </template>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <h1>
          Send Transaction
        </h1>
        <ul v-if="transactions.length">
          <li v-for="tx in transactions" :key="tx.data">
            {{ shortenHash(tx.data) }}
          </li>
        </ul>

        <EstimatedFee :data="data" :loading="estimatePending" :error="error" />

        <CommonButton v-if="transactions.length" class="max-w-fit" type="button" @click="handleSendTransaction">
          Send transaction
        </CommonButton>
      </div>
    </div>
  </div>
</template>
