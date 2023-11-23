<script setup lang="ts">
const props = defineProps<{
  chainSigners: ChainSigners
}>()

defineEmits(['destroy'])
const { getContactNameByAddress } = useContacts()
const { selectedSafe } = storeToRefs(useSafe())

const [DefineTemplate, AddressItem] = createReusableTemplate()
const transferCounts = ref<ITransferCount[]>([])

const allUniqueAddresses = computed(() => {
  const addresses = Object.values(props.chainSigners).flat()

  return [...new Set(addresses)].map((i) => {
    return {
      contact: getContactNameByAddress(i),
      address: i,
    }
  })
})

const contractAddedAddresses = computed(() => allUniqueAddresses.value.filter(i => !!i.contact))
const noContractAddedAddresses = computed(() => allUniqueAddresses.value.filter(i => !i.contact))

function getTransferCountByAddress(address: string) {
  return transferCounts.value.find(i => isAddressEqual(i.to, address))?.transferCount || 0
}

async function fetchTransferCounts() {
  transferCounts.value = await $fetch<ITransferCount[]>('/api/transfers', {
    params: {
      from: selectedSafe.value?.safe_address,
      to: allUniqueAddresses.value.map(i => i.address),
      chainIds: allUniqueAddresses.value.map(_i => 0),
    },
  })
}

onMounted(() => fetchTransferCounts())
</script>

<template>
  <div>
    <DefineTemplate v-slot="{ item } : any">
      <div class="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-[14px]">
        <div class="flex flex-col gap-3">
          <div class="flex justify-between">
            <div class="flex items-center gap-2">
              <AuthorityAvatar class="h-4.5 w-4.5" :address="item.address" />
              <span class="text-sm">
                {{ shortenHash(item.address) }}
              </span>
            </div>
            <span class="text-xs text-gray-400">
              Sent
              {{ getTransferCountByAddress(item.address) }}
              times
            </span>
          </div>
          <span v-if="item.contact" class="text-xl/5">
            {{ item.contact }}
          </span>
          <CommonInput placeholder="Enter name" input-classes="!p-0" container-classes="!px-0" transparent />
        </div>
      </div>
    </DefineTemplate>
    <div class="flex flex-col gap-5 border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <Steps :total-steps="3" :current-step="1" />
      <ModalTitle>
        <template #icon>
          1
        </template>
        <template #title>
          Add Contact Info
        </template>
        <template #subtitle>
          You can add Contact Names for easier access. This information remainds local.
        </template>
      </ModalTitle>
    </div>

    <div class="flex flex-col gap-5 py-5 sm:px-7.5 sm:pb-7.5">
      <div v-if="noContractAddedAddresses.length" class="rounded-2xl bg-gray-850 px-4 py-[14px]">
        <span class="mb-2.5 block text-xs text-gray-400">
          New contacts
        </span>
        <AddressItem v-for="item in noContractAddedAddresses" :key="item.address" :item="item" />
      </div>

      <div v-if="contractAddedAddresses.length" class="rounded-2xl bg-gray-850 px-4 py-[14px]">
        <span class="mb-2.5 block text-xs text-gray-400">
          Already in Contact List
        </span>
        <AddressItem v-for="item in contractAddedAddresses" :key="item.address" :item="item" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 border-t border-gray-875 py-5 sm:px-7.5 sm:pb-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>
      <CommonButton class="justify-center" size="lg">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
