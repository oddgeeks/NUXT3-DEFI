<script setup lang="ts">
const emit = defineEmits(['destroy'])

const { signers } = storeToRefs(useMultisig())
const { getContactNameByAddress } = useContacts()
const { selectedSafe } = storeToRefs(useSafe())

function isAddressOwner(address: string) {
  return isAddressEqual(selectedSafe.value?.owner_address, address)
}

const selectedAddresses = ref<string[]>([])

function isAddressSelected(address: string) {
  return selectedAddresses.value.includes(address)
}

function toggleAddress(address: string) {
  if (isAddressSelected(address))
    selectedAddresses.value = selectedAddresses.value.filter(i => i !== address)

  else
    selectedAddresses.value = [...selectedAddresses.value, address]
}

function handleNext() {
  openDeleteSignersByNetwork(selectedAddresses.value)
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-5 border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <Steps :total-steps="3" :current-step="1" />
      <ModalTitle class="items-center">
        <template #icon>
          1
        </template>
        <template #title>
          Delete Signer(s)
        </template>
        <template #subtitle>
          Please carefully review all changes. You can select networks on the next page.
        </template>
      </ModalTitle>
    </div>

    <ul class="flex flex-col gap-2.5 px-7.5 py-5">
      <li
        v-for="signer in signers" :key="signer.address" :class="[
          isAddressOwner(signer.address) ? 'mb-2.5' : 'border border-gray-800 hover:bg-gray-900',
          isAddressSelected(signer.address) ? 'bg-gray-900' : '',
        ]" class="rounded-2xl bg-gray-850"
      >
        <button :disabled="isAddressOwner(signer.address)" class="flex w-full justify-between px-4 py-[14px] text-left" @click="toggleAddress(signer.address)">
          <div class="flex items-center gap-3">
            <AuthorityAvatar :address="signer.address" />
            <div class="flex flex-col gap-0.5">
              <span class="text-sm">
                {{ getContactNameByAddress(signer.address) }}
              </span>
              <span class="flex items-center gap-2 text-xs/5 text-gray-400">
                {{ signer.address }} <Copy :text="signer.address" icon-class="w-3" icon-only />
              </span>
            </div>
          </div>
          <div v-if="isAddressOwner(signer.address)" class="flex h-fit items-center gap-2 text-sm">
            <SvgoCrown />
            Owner
          </div>
          <SvgoCheckCircle v-else :class="isAddressSelected(signer.address) ? 'success-circle' : 'svg-circle darker'" class="h-5.5 w-5.5" />
        </button>
      </li>
    </ul>

    <div class="grid grid-cols-2 gap-4 border-t border-gray-875 py-5 sm:px-7.5 sm:pb-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>
      <CommonButton :disabled="!selectedAddresses.length" class="justify-center" size="lg" @click="handleNext">
        Next
      </CommonButton>
    </div>
  </div>
</template>
