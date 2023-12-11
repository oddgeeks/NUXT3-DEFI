<script setup lang=ts>
import { getAddress } from 'ethers/lib/utils'

const props = defineProps<{
  chainId?: string | number
  activeTab: string | undefined
  networkCellVisible?: boolean
}>()

const emit = defineEmits(['onToggle', 'loading'])

const abortController = ref<AbortController | null>(null)

const { lastModal } = useModal()

const { account } = useWeb3()
const { isAccountCanSign } = useMultisig()
const { selectedSafe } = storeToRefs(useSafe())
const { checkTransactionExecuted } = useAvocadoSafe()
const { multisigURL } = storeToRefs(useEnvironmentState())

const isCollapseAll = inject<Ref<boolean>>('isCollapseAll', ref(false))
const route = useRoute()
const page = ref(1)
const containerRef = ref<HTMLElement | null>(null)
const data = ref<IMultisigTransactionResponse | null>(null)
const pending = ref(false)

const isDetailsOpen = useCookie<boolean>(`multisig-collapse-${route.params.safe}-${props.chainId}`, {
  default: () => false,
  watch: 'shallow',
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
})

const { resume, pause } = useIntervalFn(() => {
  refreshAll()
}, 7500, {
  immediate: false,
})

async function fetchTransactions() {
  try {
    if (abortController.value)
      abortController.value.abort()

    pause()

    pending.value = true

    abortController.value = new AbortController()

    const isCompleted = props.activeTab === 'completed'

    const response = await http<IMultisigTransactionResponse>(`/safes/${route.params.safe}/transactions`, {
      retry: 3,
      signal: abortController.value?.signal,
      params: {
        status: isCompleted ? ['success', 'failed'] : 'pending',
        chain_id: props.chainId,
        nonce_type: isCompleted ? undefined : props.activeTab,
        page: page.value,
      },
      baseURL: multisigURL.value,
    })

    abortController.value = null

    response.data = response.data.map((i) => {
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

    data.value = response
  }
  catch (e: any) {
    if (e.message === 'canceled')
      return

    throw e
  }
  finally {
    resume()
    emit('loading', false)
    pending.value = false
  }
}

watchThrottled([page, () => props.activeTab], () => {
  fetchTransactions()
}, {
  throttle: 500,
  immediate: true,
})

const canSign = computed(() => props.chainId ? isAccountCanSign(props.chainId, account.value, selectedSafe.value?.owner_address) : false)

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
  emit('onToggle')
}

function refreshAll() {
  fetchTransactions()
}

const isYourSignNeeded = computed(() => {
  if (!selectedSafe.value?.safe_address || !account.value || !canSign.value)
    return false

  return data.value?.data.some((data_item) => {
    const executing = useCookie(`executing-${data_item.id}`, {
      default() {
        return false
      },
    })
    const isConfirmationsMatch = gte(data_item.confirmations.length, data_item.confirmations_required)
    const isTransactionExecuted = checkTransactionExecuted(data_item)
    const isTransactionFailed = data_item.status === 'failed'
    if (executing.value || isTransactionExecuted || isConfirmationsMatch || isTransactionFailed)
      return false
    return getAddress(data_item.safe_address) === getAddress(selectedSafe.value?.safe_address || '')
      && !data_item.confirmations.find(item =>
        getAddress(account.value) === getAddress(item.address),
      )
  })
})

watch(lastModal, () => {
  // Refresh data when modal is closed
  if (!lastModal.value)
    refreshAll()
})

watch(isCollapseAll, () => {
  if (isCollapseAll.value && data.value?.data?.length)
    isDetailsOpen.value = false
})

onUnmounted(() => {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
})
</script>

<template>
  <component :is="chainId ? 'details' : 'div'" v-if="data?.data?.length" ref="containerRef" :open="isDetailsOpen" class="group rounded-2xl bg-gray-850 sm:open:pb-0" @toggle="handleToggle">
    <summary v-if="chainId" class="flex cursor-pointer items-center gap-2.5 px-5 py-4 text-xs font-medium leading-5 text-gray-400">
      <ChainLogo class="h-5 w-5" :chain="chainId" />
      <span v-if="chainId" class="text-white">
        {{ chainIdToName(chainId) }}
      </span>
      <div>
        {{ data.meta.total }} total transaction{{ data.meta.total > 1 ? 's' : '' }}
      </div>
      <SvgSpinner v-if="pending" class="text-primary" />
      <div class="ml-auto flex items-center">
        <div v-if="!canSign && !isDetailsOpen" class="rounded-full bg-red-alert/10 px-3 py-1 text-xs text-red-alert">
          Unauthorized network
        </div>
        <div v-if="isYourSignNeeded && !isDetailsOpen" class="text-xs text-orange-400">
          Your signatures needed
        </div>
        <SvgoChevronDown
          class="ml-5 w-5 text-gray-400 group-open:rotate-180"
        />
      </div>
    </summary>
    <div class="flex flex-col gap-4 p-5 sm:gap-0 sm:p-0">
      <ul v-if="activeTab === 'completed'" class="flex flex-col gap-4 sm:block">
        <MultisigPendingTransactionItem v-for="item in data.data" :key="item.id" network-cell-visible :inside-group="false" :active-tab="activeTab" :item="item" />
      </ul>
      <ul v-for="items, key in groupedData" v-else :key="key">
        <li>
          <ul :class="checkIsGroup(key, items) ? 'p-4 my-4 sm:p-0 border sm:block flex gap-5 flex-col border-slate-750 rounded-5 bg-slate-850 ' : ''" class="flex flex-col">
            <p v-if="checkIsGroup(key, items)" class="flex items-center gap-2.5 border-b  border-gray-800 text-xs  font-medium text-gray-400  sm:p-4">
              <SvgoInfo2 class="text-gray-500" />
              You can complete one of the transactions below. The other will be cancelled automatically.
            </p>
            <MultisigPendingTransactionItem v-for="item in sortItems(items)" :key="item.id" :inside-group="checkIsGroup(key, items)" :active-tab="activeTab" :item="item" />
          </ul>
        </li>
      </ul>
    </div>
    <Pagination class="px-4 pb-4 sm:px-0" :auto-navigate="false" :current="data.meta.current_page" :limit="data.meta.per_page" :total="data.meta.total" @update:current="handleCurrentUpdate" />
  </component>
</template>
