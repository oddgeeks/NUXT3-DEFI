<script setup lang="ts">
import { wait } from '@instadapp/utils'
import axios from 'axios'

const route = useRoute()
const itemsRef = ref<HTMLElement | null>(null)
const [isCollapseAll, toggle] = useToggle(false)
const isCollapseAllDisabled = ref(false)

definePageMeta({
  alias: '/2fa/:safe/pending-transactions',
})

const { getSafeOptions } = useSafe()
const { selectedSafe, safeOptions } = storeToRefs(useSafe())

provide('isCollapseAll', isCollapseAll)

useAccountTrack(undefined, () => {
  useEagerConnect()
})

async function syncOptions() {
  if (!selectedSafe.value)
    return

  await until(selectedSafe).toMatch(s => !!s?.safe_address)

  if (!safeOptions.value?.length)
    return

  await wait(1000)

  getSafeOptions(selectedSafe.value)
}

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
  const is2FA = route.path.includes('2fa')

  const completeTab = {
    value: undefined,
    label: 'Completed',
    query: 'completed',
    title: null,
    mobileLabel: null,
    count: null,
  }

  if (is2FA) {
    return [
      {
        value: 'pending',
        title: 'Pending transactions need to be executed in the order they were proposed in.',
        query: 'pending',
        mobileLabel: 'Pending',
        label: 'Pending',
        count: toBN(seqResponse.value?.meta?.total || 0).plus(toBN(nonSeqResponse.value?.meta?.total || 0)).toString(),
      },
      completeTab,
    ]
  }

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
    completeTab,
  ]
})

const title = computed(() => {
  const tab = tabs.value.find(tab => tab.value === activeTab.value)

  return tab?.title
})

function toggleLoading(status: boolean, chainId?: number) {
  if (chainId) {
    loadingPendingTxns.value[chainId] = status
    return
  }
  if (activeTab.value === 'completed') {
    loadingCompletedTxns.value = status
    return
  }
  if (activeTab.value === 'seq' || activeTab.value === 'nonseq') {
    loadingPendingTxns.value = availableNetworks.reduce((acc, network) => {
      acc[network.chainId] = status
      return acc
    }, {} as Record<number, boolean>)
  }
}

const loadingCompletedTxns = ref(false)
const loadingPendingTxns = ref(availableNetworks.reduce((acc, network) => {
  acc[network.chainId] = false
  return acc
}, {} as Record<number, boolean>))

const isLoadingPendingTxns = computed(() => {
  return activeTab.value !== 'completed' && Object.values(loadingPendingTxns.value).some(i => i)
})

const isLoadingCompletedTxns = computed(() => {
  return activeTab.value === 'completed' && loadingCompletedTxns.value
})

useIntervalFn(() => {
  refreshNonSeq()
  refreshSeq()
}, 5000)

watch(activeTab, async () => {
  toggleLoading(true)
  await nextTick()
  await wait(500)
  syncToggles()
})

onMounted(() => {
  syncToggles()
  syncOptions()
})
</script>

<template>
  <div class="flex-1">
    <div class="mb-5 flex flex-col gap-5 sm:mb-0">
      <h1 class="text-center sm:text-left">
        Transactions
      </h1>

      <div class="flex justify-between">
        <div class="flex w-fit self-center rounded-10 bg-slate-50 p-1.5 font-medium dark:bg-gray-850 sm:self-baseline">
          <button
            v-for="tab in tabs"
            :key="tab.label"
            :class="
              tab.query === activeTab ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'
            "
            class="laeding-5 flex flex-1 items-center justify-center gap-2.5 whitespace-nowrap rounded-7.5 px-4 py-2 text-xs"
            @click="$router.replace({ query: { tab: tab.query }, path: $router.currentRoute.value.path })"
          >
            <span class="hidden sm:block"> {{ tab.label }}</span>
            <span class="block sm:hidden"> {{ tab.mobileLabel || tab.label }}</span>
            <span v-if="tab?.count" class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-slate-500 px-[5px] text-xs text-white">
              {{ tab?.count }}
            </span>
          </button>
        </div>
        <button v-if="activeTab !== 'completed'" :disabled="isCollapseAllDisabled" class="text-xs text-primary disabled:text-slate-400" type="button" @click="toggle(true)">
          Collapse All
        </button>
      </div>

      <h2 v-if="title" class="text-center text-xs font-medium leading-5 sm:text-left">
        {{ title }}
      </h2>
      <div ref="itemsRef" class="flex flex-col gap-5">
        <template v-if="activeTab === 'completed'">
          <MultisigLoadingTransactionItems v-if="isLoadingCompletedTxns" />
          <MultisigPendingTransactionItems :class="{ hidden: isLoadingCompletedTxns }" network-cell-visible :active-tab="activeTab" @on-toggle="syncToggles" @loading="toggleLoading" />
        </template>
        <template v-else>
          <MultisigLoadingTransactionItems v-if="isLoadingPendingTxns" />
          <MultisigPendingTransactionItems v-for="network in availableNetworks" :key="network.chainId" :class="{ hidden: isLoadingPendingTxns }" :active-tab="activeTab" :chain-id="network.chainId" @on-toggle="syncToggles" @loading="(status) => toggleLoading(status, network.chainId)" />
        </template>
      </div>
    </div>
  </div>
  <NuxtPage v-if="$route.params.id" :page-key="String($route.params.id) + String($route.query.tab)" />
</template>
