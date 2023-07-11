<script setup lang="ts">
import { getAddress } from 'ethers/lib/utils'

const props = defineProps<{
  addresses: string[]
  chainId: number | string
}>()

const { selectedSafe } = storeToRefs(useSafe())

const sortedAddresses = computed(() => {
  const ownerAddress = selectedSafe.value?.owner_address || ''

  return props.addresses
    .map(i => ({
      address: i,
      owner: ownerAddress ? getAddress(i) === getAddress(ownerAddress) : false,
    }))
    .sort((a, b) => {
      if (a.owner && !b.owner)
        return -1
      if (!a.owner && b.owner)
        return 1
      return 0
    })
})
</script>

<template>
  <MultisigSafeItem v-for="item in sortedAddresses" :key="item.address" :owner="item.owner" :chain-id="chainId" :address="item.address" />
</template>
