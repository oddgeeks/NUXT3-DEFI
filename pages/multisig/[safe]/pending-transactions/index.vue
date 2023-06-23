<script setup lang="ts">
import axios from 'axios'
import { storeToRefs } from 'pinia'

const route = useRoute()

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
    <div>
      <button class="mr-2" @click="$router.push({ query: { status: 'pending' } })">
        Pending
      </button>
      <button @click="$router.push({ query: { status: ['success', 'failed'] } })">
        History
      </button>

      <ul v-if="data" class="flex flex-col gap-5">
        <li v-for="item in data.data" :key="item.id" class="flex items-center gap-5">
          {{ item.status }}

          {{ item.nonce }}
          <button v-if="signNeeded(item)" @click="handleSign(item)">
            Sign
          </button>
          <span v-else class="text-slate-400">
            Already signed
          </span>
          <CommonButton v-if="item.confirmations.length === item.confirmations_required" @click="handleExecute(item)">
            execute
          </CommonButton>

          <span v-if="checkTxIsCancelRequest(item)">
            This is cancel request
          </span>

          <CommonButton v-else color="red" @click="rejectMultisigTransaction(item)">
            Reject
          </CommonButton>
        </li>
      </ul>
    </div>
  </div>
</template>
