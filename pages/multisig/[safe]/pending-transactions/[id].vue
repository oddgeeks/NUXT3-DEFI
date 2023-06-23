<script setup lang="ts">
import axios from 'axios'
import { isAddress } from 'ethers/lib/utils'

const route = useRoute()

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const safe = route.params.safe as string

const status = computed(() => route.query.status || ['pending'])

if (!safe || !isAddress(safe)) {
  throw createError({
    message: 'Invalid safe address',
    statusCode: 404,
  })
}

const { data } = useAsyncData<IMultisigTransactionResponse>(`${route.params.safe}+${route.params.id}`, async () => {
  const { data } = await axios.get(`/safes/${route.params.safe}/transactions/${route.params.id}`, {
    baseURL: multisigURL,
  })

  return data
}, {
  watch: [status],
  immediate: true,

})
</script>

<template>
  <pre class="text-xs">
    {{ data }}
  </pre>
</template>
