<script setup lang="ts">
import { wait } from '@instadapp/utils'
import axios from 'axios'

const route = useRoute()
const itemsRef = ref<HTMLElement | null>(null)
const [isCollapseAll, toggle] = useToggle(false)
const isCollapseAllDisabled = ref(false)

provide('isCollapseAll', isCollapseAll)

useAccountTrack(undefined, () => {
  useEagerConnect()
})

function syncToggles() {
  if (itemsRef.value) {
    const details = itemsRef.value.querySelectorAll('details')
    const someOpen = Array.from(details).some(i => i.hasAttribute('open'))

    isCollapseAllDisabled.value = !someOpen
    isCollapseAll.value = !someOpen
  }
}

const activeTab = computed(() => {
  return route.query?.tab ? route.query.tab as string : 'seq'
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
}, {
  lazy: true,
  server: false,
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
}, {
  lazy: true,
  server: false,
})

const tabs = computed(() => {
  return [
    {
      value: 'seq',
      query: 'seq',
      mobileLabel: 'Seq',
      label: 'Sequential',
      title: 'Sequential transactions need to be executed in the order they were proposed in.',
      count: seqResponse.value?.meta?.total || 0,
    },
    {
      value: 'nonseq',
      query: 'nonseq',
      label: 'Non-Sequential',
      mobileLabel: 'Non-Seq',
      title: 'Non-Sequential transactions can be executed in any order.',
      count: nonSeqResponse.value?.meta?.total || 0,
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
}, 5000)

watch(activeTab, async () => {
  await nextTick()
  await wait(500)
  syncToggles()
})

onMounted(() => {
  syncToggles()
})
</script>

<template>
  <div class="flex-1">
    <div class="flex flex-col gap-5 sm:mb-0 mb-5">
      <h1 class="text-center sm:text-left">
        Transactions
      </h1>

      <div class="flex justify-between">
        <div class="bg-slate-50 dark:bg-gray-850 rounded-10 p-1.5 flex w-fit sm:self-baseline self-center font-medium">
          <button
            v-for="tab in tabs"
            :key="tab.label"
            :class="
              tab.query === activeTab ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'
            "
            class="px-4 justify-center flex-1 text-xs rounded-7.5 gap-2.5 whitespace-nowrap py-2 laeding-5 flex items-center"
            @click="$router.replace({ query: { tab: tab.query } })"
          >
            <span class="sm:block hidden"> {{ tab.label }}</span>
            <span class="sm:hidden block"> {{ tab.mobileLabel || tab.label }}</span>
            <span v-if="tab?.count" class="flex items-center justify-center min-w-[20px] h-5 px-[5px] bg-slate-500 text-xs rounded-full text-white">
              {{ tab?.count }}
            </span>
          </button>
        </div>
        <button :disabled="isCollapseAllDisabled" class="text-primary text-xs disabled:text-slate-400" type="button" @click="toggle(true)">
          Collapse All
        </button>
      </div>

      <h2 v-if="title" class="text-xs leading-5 sm:text-left text-center font-medium">
        {{ title }}
      </h2>
      <div ref="itemsRef" class="gap-5 flex flex-col">
        <MultisigPendingTransactionItems v-for="network in availableNetworks" :key="network.chainId" :active-tab="activeTab" :chain-id="network.chainId" @on-toggle="syncToggles" />
      </div>
    </div>
  </div>
  <NuxtPage v-if="$route.params.id" :page-key="String($route.params.id) + String($route.query.tab)" />
</template>
