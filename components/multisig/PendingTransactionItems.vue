<script setup lang=ts>
import { isUndefined } from '@walletconnect/utils'
import axios from 'axios'

const props = defineProps<{
  chainId: string | number
  activeTab: string | undefined
}>()

const route = useRoute()
const page = ref(1)
const containerRef = ref<HTMLElement | null>(null)

const { data, refresh } = useAsyncData(`multisig-${route.params.safe}-${props.chainId}`, async () => {
  const { data } = await axios.get<IMultisigTransactionResponse>(`/safes/${route.params.safe}/transactions`, {
    params: {
      status: isUndefined(props.activeTab) ? ['success', 'failed'] : 'pending',
      chain_id: props.chainId,
      nonce_type: props.activeTab,
      page: page.value,
    },
    baseURL: multisigURL,
  })

  data.data = data.data.map((i) => {
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

  return data
}, {
  watch: [() => props.activeTab, page],
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

useIntervalFn(() => {
  refresh()
}, 15000)
</script>

<template>
  <details v-if="data?.data?.length" ref="containerRef" open class="py-[14px] open:pb-0 group">
    <summary class="dark:bg-slate-850 bg-slate-150 py-2.5 flex items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
      <ChainLogo class="w-5 h-5" :chain="chainId" />
      {{ chainIdToName(chainId) }}

      <SvgoChevronDown
        class="w-5 text-slate-400 ml-auto group-open:rotate-180"
      />
    </summary>

    <ul v-for="items, key in groupedData" :key="key">
      <li>
        <ul :class="key !== '-1' && items.length > 1 ? 'border rounded-lg border-slate-300 dark:border-slate-700' : ''" class="flex flex-col">
          <p v-if="key !== '-1' && items.length > 1" class="text-xs p-4 pb-0 font-medium text-slate-400">
            You can complete one of the transactions below. The other will be cancelled automatically.
          </p>
          <MultisigPendingTransactionItem v-for="item in items" :key="item.id" :active-tab="activeTab" :item="item" />
        </ul>
      </li>
    </ul>
    <Pagination :auto-navigate="false" :current="data.meta.current_page" :limit="data.meta.per_page" :total="data.meta.total" @update:current="handleCurrentUpdate" />
  </details>
</template>
