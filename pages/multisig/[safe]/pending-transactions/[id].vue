<script setup lang="ts">
import axios from 'axios'
import { isAddress } from 'ethers/lib/utils'

const route = useRoute()

const safe = route.params.safe as string

definePageMeta({
  alias: '/2fa/:safe/pending-transactions/:id',
})

if (!safe || !isAddress(safe)) {
  throw createError({
    message: 'Invalid safe address',
    statusCode: 404,
  })
}

const { data } = useAsyncData<IMultisigTransaction>(`${route.params.safe}+${route.params.id}`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions/${route.params.id}`, {
    baseURL: multisigURL,
  })

  return data
}, {
  immediate: true,

})

watch(data, () => {
  if (data.value)
    openMultisigTransactionDetails(data.value)
}, {
  immediate: true,
})
</script>

<template>
  <div class="sr-only">
    pending tx modal
  </div>
</template>
