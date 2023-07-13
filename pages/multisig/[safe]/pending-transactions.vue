<script setup lang="ts">
import axios from 'axios'

const route = useRoute()

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const activeTab = computed(() => {
  return route.query?.tab ? route.query.tab as string : 'nonseq'
})

const { data: nonSeqResponse, refresh: refreshNonSeq } = useAsyncData<IMultisigTransactionResponse>(`${route.params.safe}-non-seq-count`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions`, {
    params: {
      status: 'pending',
      nonce_type: 'nonseq',
    },
    baseURL: multisigURL,
  })

  return data
})

const { data: seqResponse, refresh: refreshSeq } = useAsyncData<IMultisigTransactionResponse>(`${route.params.safe}-seq-count`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions`, {
    params: {
      status: 'pending',
      nonce_type: 'seq',
    },
    baseURL: multisigURL,
  })

  return data
})

const tabs = computed(() => {
  return [
    {
      value: 'nonseq',
      query: 'nonseq',
      label: `Non-Sequential (${nonSeqResponse.value?.meta?.total || 0})`,
      title: 'Non-Sequential transactions can be executed in any order.',
    },
    {
      value: 'seq',
      query: 'seq',
      label: `Sequential (${seqResponse.value?.meta?.total || 0})`,
      title: 'Sequential transactions need to be executed in the order they were proposed in.',
    },
    {
      value: undefined,
      label: 'Completed',
      query: 'completed',
    },
  ]
})

const title = computed(() => {
  const tab = tabs.value.find(tab => tab.value === activeTab.value)

  return tab?.title
})

useIntervalFn(() => {
  refreshNonSeq()
  refreshSeq()
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
            tab.query === activeTab ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'
          "
          class="px-4 justify-center flex-1 text-xs rounded-7.5 whitespace-nowrap py-2 laeding-5 flex items-center"
          @click="$router.replace({ query: { tab: tab.query } })"
        >
          {{ tab.label }}
        </button>
      </div>

      <h2 v-if="title" class="text-xs">
        {{ title }}
      </h2>
      <div class="dark:bg-gray-850 bg-slate-50 rounded-[25px] overflow-hidden">
        <MultisigPendingTransactionItems v-for="network in availableNetworks" :key="network.chainId" :active-tab="activeTab" :chain-id="network.chainId" />
      </div>
    </div>
    <NuxtPage :page-key="String($route.params.id)" />
  </div>
</template>
