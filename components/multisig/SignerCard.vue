<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  chainId: number | string
}>()

const { getContactNameByAddress } = useContacts()
const { getRequiredSigner } = useMultisig()

const threshold = ref()

const chainSigners = computed(() => [...props.safe.signers[props.chainId]].sort((address) => {
  const isOwner = checkAddressIsOwner(address)
  return isOwner ? -1 : 1
}))

function checkAddressIsOwner(address: string) {
  return isAddressEqual(address, props.safe.owner_address)
}

onMounted(async () => {
  threshold.value = await getRequiredSigner(props.safe.safe_address, props.chainId)
})
</script>

<template>
  <div class="h-fit rounded-5 border border-gray-800 bg-gray-850 p-5">
    <div class="flex flex-col gap-5">
      <div class="flex items-center gap-2.5">
        <ChainLogo class="h-10 w-10" :chain="chainId" />
        {{ chainIdToName(chainId) }}
      </div>
      <ul class="flex flex-col gap-2.5">
        <li v-for="address, i in chainSigners" :key="address" class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 text-xs">
            <AuthorityAvatar class="h-5 w-5" :address="address" />
            {{ getContactNameByAddress(address) || 'Name' }} <span v-if="i === 0">(Owner)</span>
          </div>
          <span v-tippy="address" class="text-xs text-gray-400">
            {{ shortenHash(address) }}
          </span>
        </li>
      </ul>
      <div v-if="threshold !== undefined" class="flex items-center justify-between text-xs text-gray-400">
        <div class="flex items-center gap-2">
          <SvgoStamp />
          {{ threshold }}
          confirm. req.
        </div>
        <div class="flex items-center gap-2">
          <SvgoUsers />
          {{ threshold }}
          total signer(s)
        </div>
      </div>
    </div>
  </div>
</template>
