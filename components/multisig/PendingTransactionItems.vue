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

  return data
}, {
  watch: [() => props.activeTab, page],
  immediate: true,
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
    <ul class="flex flex-col">
      <MultisigPendingTransactionItem v-for="item in data.data" :key="item.id" :active-tab="activeTab" :item="item" />
      <Pagination :auto-navigate="false" :current="data.meta.current_page" :limit="data.meta.per_page" :total="data.meta.total" @update:current="handleCurrentUpdate" />
    </ul>
  </details>
</template>
