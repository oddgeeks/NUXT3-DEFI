<script setup lang="ts">
import axios from 'axios'
import collect from 'collect.js'

const route = useRoute()

type GroupedByNetwork = Record<string, IMultisigTransaction[]> | null

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const activeTab = ref('non-seq')

const tabs = computed(() => {
  return [
    {
      value: 'non-seq',
      label: `Non-Sequential (${nonSeq.value.length})`,
      title: 'Non-Sequential transactions can be executed in any order.',
    },
    {
      value: 'seq',
      label: `Sequential (${seq.value.length})`,
      title: 'Sequential transactions need to be executed in the order they were proposed in.',
    },
    {
      value: 'completed',
      label: 'Completed',
    },
  ]
})

const title = computed(() => {
  const tab = tabs.value.find(tab => tab.value === activeTab.value)

  return tab?.title
})

const { data, refresh: refreshPendingTransactions } = useAsyncData<IMultisigTransactionResponse>(`${route.params.safe}`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions`, {
    params: {
      status: 'pending',
    },
    baseURL: multisigURL,
  })

  return data
}, {
  watch: [activeTab],
  immediate: true,
})

const { data: completedTransactions, refresh: refreshCompletedTransactions } = useAsyncData<IMultisigTransactionResponse>(`${route.params.safe}+completed`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions`, {
    params: {
      status: ['success', 'failed'],
    },
    baseURL: multisigURL,
  })

  return data
}, {
  watch: [activeTab],
  immediate: true,
})

function groupByNonce(txs: IMultisigTransaction[]) {
  const collection = collect(txs || [])

  const txsByNonce = collection.groupBy('nonce').all()

  console.log(txsByNonce)
  return txs
}

const nonSeq = computed(() => {
  if (!data.value)
    return []

  return data.value.data.filter(item => item.nonce == '-1')
})

const seq = computed(() => {
  if (!data.value)
    return []

  return data.value.data.filter(item => item.nonce != '-1')
})

const actualTransactions = computed(() => {
  if (activeTab.value === 'non-seq')
    return nonSeq.value

  if (activeTab.value === 'seq')
    return seq.value

  return completedTransactions.value?.data || []
})

const groupedByNetwork = computed<GroupedByNetwork>(() => {
  if (!actualTransactions.value)
    return {}

  const collection = collect(actualTransactions.value || [])

  return collection.groupBy('chain_id').all()
})

useIntervalFn(() => {
  refreshPendingTransactions()
  refreshCompletedTransactions()
}, 15000)
</script>

<template>
  <div class="flex-1">
    <div class="flex flex-col gap-5">
      <h1>
        Transactions
      </h1>

      <div class="bg-slate-50 dark:bg-gray-850 rounded-10 p-1.5 flex w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.label"
          :class="
            tab.value === activeTab ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'
          "
          class="px-4 justify-center flex-1 text-xs rounded-7.5 whitespace-nowrap py-2 laeding-5 flex items-center"
          @click="activeTab = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <h2 v-if="title" class="text-xs">
        {{ title }}
      </h2>

      <div class="dark:bg-gray-850 bg-slate-50 rounded-[25px] overflow-hidden">
        <details v-for="items, chainId in groupedByNetwork" :key="chainId" open class="py-[14px] group">
          <summary class="dark:bg-slate-850 bg-slate-150 py-2.5 flex items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
            <ChainLogo class="w-5 h-5" :chain="chainId" />
            {{ chainIdToName(chainId) }}

            <SvgoChevronDown
              class="w-5 text-slate-400 ml-auto group-open:rotate-180"
            />
          </summary>
          <ul class="flex flex-col">
            <MultisigPendingTransactionItem v-for="item in items" :key="item.id" :active-tab="activeTab" :item="item" />
          </ul>
        </details>
      </div>
    </div>
  </div>
</template>
