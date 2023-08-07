<script setup lang=ts>
import axios from 'axios'

const props = defineProps<{
  chainId: string | number
  activeTab: string | undefined
}>()

const abortController = ref<AbortController | null>(null)

const { getRequiredSigner } = useMultisig()
const { getCurrentNonce } = useAvocadoSafe()
const { fetchSafe } = useSafe()
const { lastModal } = useModal()

const route = useRoute()
const page = ref(1)
const containerRef = ref<HTMLElement | null>(null)

const isDetailsOpen = useCookie<boolean>(`multisig-collapse-${route.params.safe}-${props.chainId}`, {
  default: () => false,
  watch: 'shallow',
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
})

const { resume, pause } = useIntervalFn(() => {
  refreshAll()
}, 5000, {
  immediate: false,
})

const { data, refresh, pending } = useAsyncData(`multisig-${route.params.safe}-${props.chainId}-${props.activeTab}`, async () => {
  try {
    if (abortController.value)
      abortController.value.abort()

    pause()

    abortController.value = new AbortController()

    const isCompleted = props.activeTab === 'completed'

    const { data: axiosData } = await axios.get<IMultisigTransactionResponse>(`/safes/${route.params.safe}/transactions`, {
      signal: abortController.value?.signal,
      params: {
        status: isCompleted ? ['success', 'failed'] : 'pending',
        chain_id: props.chainId,
        nonce_type: isCompleted ? undefined : props.activeTab,
        page: page.value,
      },
      baseURL: multisigURL,
    })

    abortController.value = null

    axiosData.data = axiosData.data.map((i) => {
      try {
        const metadata = i.data.params?.metadata ? decodeMetadata(i.data.params.metadata) as string[] : []
        const rejectionMetadata = metadata.find((i: any) => i?.type === 'rejection') as any

        return {
          ...i,
          groupKey: i.nonce != '-1' ? i.nonce : rejectionMetadata?.id ? rejectionMetadata.id : i.id,
        }
      }
      catch {
        return i
      }
    })

    return axiosData
  }
  catch (e: any) {
    console.log(e)
    if (e.message === 'canceled')
      return

    throw e
  }
  finally {
    resume()
  }
}, {
  watch: [() => props.activeTab, page],
  immediate: true,
})

const { data: currentNonce } = useAsyncData(`current-nonce-${route.params.safe}-${props.chainId}`, async () => {
  const safe = await fetchSafe(route.params.safe as string)

  return getCurrentNonce(props.chainId, safe.owner_address)
})

const { data: requiredSigner, refresh: refreshSigner } = useAsyncData<number>(`multisig-required-signer-${route.params.safe}-${props.chainId}`, async () => {
  const multisigAddress = route.params.safe as string
  return getRequiredSigner(multisigAddress, props.chainId)
}, {
  immediate: true,
})

const groupedData = computed(() => {
  const groupedData = groupBy(data.value?.data || [], (item) => {
    return item.groupKey || item.nonce
  })

  return groupedData as Record<string, IMultisigTransaction[]>
})

function handleCurrentUpdate(val: number) {
  page.value = val

  if (containerRef.value) {
    setTimeout(() => {
      containerRef.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 200)
  }
}

function checkIsGroup(key: string, items: IMultisigTransaction[]) {
  return key !== '-1' && items.length > 1
}

function sortItems(items: IMultisigTransaction[]) {
  return items.sort((a, b) => a.created_at > b.created_at ? -1 : 1)
}

function handleToggle(e: Event) {
  const target = e.target as HTMLDetailsElement
  isDetailsOpen.value = target.open
}

function refreshAll() {
  refresh()
  refreshSigner()
}

watch(lastModal, () => {
  // Refresh data when modal is closed
  if (!lastModal.value)
    refreshAll()
})
</script>

<template>
  <details v-if="data?.data?.length" ref="containerRef" :open="isDetailsOpen" class="dark:bg-gray-850 rounded-2xl bg-slate-50 sm:open:pb-0 group" @toggle="handleToggle">
    <summary class="py-4 flex cursor-pointer items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
      <ChainLogo class="w-5 h-5" :chain="chainId" />
      <span class="text-white">
        {{ chainIdToName(chainId) }}

      </span>

      <div>
        {{ data.meta.total }} total transaction{{ data.meta.total > 1 ? 's' : '' }}
      </div>

      <SvgSpinner v-if="pending" class="text-primary" />

      <SvgoChevronDown
        class="w-5 text-slate-400 ml-auto group-open:rotate-180"
      />
    </summary>

    <div class="flex flex-col sm:gap-0 gap-4 sm:p-0 p-5">
      <ul v-if="activeTab === 'completed'">
        <li>
          <MultisigPendingTransactionItem v-for="item in data.data" :key="item.id" :current-nonce="currentNonce" :inside-group="false" :required-signer="requiredSigner" :active-tab="activeTab" :item="item" />
        </li>
      </ul>
      <ul v-for="items, key in groupedData" v-else :key="key">
        <li>
          <ul :class="checkIsGroup(key, items) ? 'p-4 my-4 sm:p-0 border sm:block flex gap-5 flex-col border-slate-300 dark:border-slate-750 rounded-5 dark:bg-slate-850 bg-slate-150' : ''" class="flex flex-col">
            <p v-if="checkIsGroup(key, items)" class="text-xs border-b border-slate-150 dark:border-slate-800 sm:p-4 flex items-center gap-2.5 sm:pb-4 font-medium  text-slate-500 dark:text-slate-400">
              <SvgoInfo2 />
              You can complete one of the transactions below. The other will be cancelled automatically.
            </p>
            <MultisigPendingTransactionItem v-for="item in sortItems(items)" :key="item.id" :current-nonce="currentNonce" :inside-group="checkIsGroup(key, items)" :required-signer="requiredSigner" :active-tab="activeTab" :item="item" />
          </ul>
        </li>
      </ul>
    </div>
    <Pagination class="sm:px-0 px-4" :auto-navigate="false" :current="data.meta.current_page" :limit="data.meta.per_page" :total="data.meta.total" @update:current="handleCurrentUpdate" />
  </details>
</template>
