<script setup lang="ts">
import axios from 'axios'
import collect from 'collect.js'
import { storeToRefs } from 'pinia'

const route = useRoute()

type GroupedByNetwork = Record<string, IMultisigTransaction[]> | null

const { selectedSafe } = storeToRefs(useAuthorities())
const { signMultisigData, multisigBroadcast, rejectMultisigTransaction } = useAvocadoSafe()
const { account } = useWeb3()

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const status = computed(() => route.query.status || ['pending'])

const { data } = useAsyncData<IMultisigTransactionResponse>(`${route.params.safe}`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions`, {
    params: {
      status: status.value,
    },
    baseURL: multisigURL,
  })

  return data
}, {
  watch: [status],
  immediate: true,

})

const tabs = computed(() => {
  return [
    {
      value: ['pending'],
      label: 'Pending',
    },
    {
      value: ['success', 'failed'],
      label: 'Completed',
    },
  ]
})

const groupedByNetwork = computed<GroupedByNetwork>(() => {
  if (!data.value || !data.value.data.length)
    return {}

  const collection = collect(data.value.data)

  return collection.groupBy('chain_id').all()
})

async function handleSign(item: IMultisigTransaction) {
  const signature = await signMultisigData({ chainId: item.chain_id, data: item.data })

  const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions/${item.id}/confirmations`, {
    address: account.value,
    signature,
  }, {
    baseURL: multisigURL,
  })

  if (data.confirmations.length === data.confirmations_required) {
    await handleExecute(data)
    alert('executed')
  }
}

async function handleExecute(item: IMultisigTransaction) {
  const hash = await multisigBroadcast({
    owner: selectedSafe.value?.owner_address!,
    confirmations: item.confirmations,
    message: item.data,
    safe: selectedSafe.value?.safe_address!,
    targetChainId: item.chain_id,
  })

  if (hash)
    showPendingTransactionModal(hash, item.chain_id, 'send')
}

function signNeeded(item: IMultisigTransaction) {
  return !item.confirmations.find(c => c.address === account.value)
}

function checkTxIsCancelRequest(item: IMultisigTransaction) {
  const actions = item.data.params.actions
  const [action] = actions
  const isDataEmpty = action && action.data === '0x'
  const isToSafeAddress = action.target.toLocaleLowerCase() === item.safe_address.toLocaleLowerCase()
  return isDataEmpty && isToSafeAddress
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-5">
      <h1>
        Transactions
      </h1>

      <div class="bg-slate-50 dark:bg-gray-850 rounded-10 p-1.5 flex w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.label"
          :class="
            JSON.stringify(tab.value) === JSON.stringify(status) ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'
          "
          class="px-4 justify-center flex-1 text-xs rounded-7.5 py-2 laeding-5 flex items-center"
          @click="$router.push({ query: { status: tab.value } })"
        >
          {{ tab.label }}
        </button>
      </div>

      <h2 class="text-xs">
        Non-Sequential transactions can be executed in any order.
      </h2>

      <div v-for="items, chainId in groupedByNetwork" :key="chainId" class="dark:bg-gray-850 bg-slate-50 rounded-[25px] pt-[14px] overflow-hidden">
        <h2 class="dark:bg-slate-850 bg-slate-150 py-2.5 flex items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
          <ChainLogo class="w-5 h-5" :chain="chainId" />
          {{ chainIdToName(chainId) }}
        </h2>
        <ul class="flex flex-col">
          <MultisigPendingTransactionItem v-for="item in items" :key="item.id" :item="item" />
        </ul>
      </div>
    </div>
  </div>
</template>
