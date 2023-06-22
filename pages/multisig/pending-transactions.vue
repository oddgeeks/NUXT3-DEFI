<script setup lang="ts">
import axios from 'axios'
import { storeToRefs } from 'pinia'

interface IMultisigTransactionResponse {
  meta: any
  data: IMultisigTransaction[]
}

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { selectedSafe, isSafeMultisig } = storeToRefs(useAuthorities())
const { signMultisigData, multisigBroadcast } = useAvocadoSafe()
const { account } = useWeb3()
const status = ref(['pending'])

const { data } = useAsyncData<IMultisigTransactionResponse>(async () => {
  if (!selectedSafe.value?.safe_address)
    return

  const { data } = await axios.get(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
    params: {
      status: status.value,
    },
    baseURL: multisigURL,
  })

  console.log(data)

  return data
}, {
  watch: [selectedSafe, status],
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

  console.log(hash)
}

async function handleReject(item: IMultisigTransaction) {
  const bab = await axios.post(`/safes/${selectedSafe.value?.safe_address}/transactions/${item.id}/confirmations`, {

  }, {
    baseURL: multisigURL,
  })
}

function signNeeded(item: IMultisigTransaction) {
  return !item.confirmations.find(c => c.address === account.value)
}
</script>

<template>
  <div>
    <div v-if="!isSafeMultisig">
      <h1 class="text-2xl font-semibold">
        Multisig
      </h1>
      <p class="text-gray-500">
        You are not a member of any multisig safe.
      </p>
    </div>

    <div v-else>
      <button class="mr-2" @click="status = ['pending']">
        Pending
      </button>
      <button @click="status = ['success', 'failed']">
        History
      </button>

      <ul v-if="data">
        <li v-for="item in data.data" :key="item.id" class="flex items-center gap-2">
          {{ item.status }}

          {{ item.created_at }}
          {{ item.nonce }}
          <button v-if="signNeeded(item)" @click="handleSign(item)">
            Sign
          </button>
          <span v-else>
            Already signed
          </span>
          <button v-if="item.confirmations.length === item.confirmations_required" @click="handleExecute(item)">
            execute
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
