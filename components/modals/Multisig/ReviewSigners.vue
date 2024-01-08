<script setup lang="ts">
const props = defineProps<{
  chainSigners: ChainSigners
}>()

defineEmits(['destroy', 'resolve'])

const { selectedSafe } = storeToRefs(useSafe())
const { getContactNameByAddress } = useContacts()

const uniqueAddresses = computed(() => {
  const addresses = Object.values(props.chainSigners).flat()

  return [...new Set(addresses)].map((i) => {
    return {
      name: getContactNameByAddress(i),
      address: i,
    }
  })
})

async function handleContinue() {
  openSignSignersModal(props.chainSigners)
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
          Review Details
        </template>
      </ModalTitle>
    </div>

    <div v-if="selectedSafe" class="px-7.5 py-5 sm:px-7.5">
      <div class="flex flex-col gap-5">
        <dl class="flex items-center">
          <dt class="basis-52 text-xs text-gray-400">
            Address
          </dt>
          <dd class="flex items-center gap-2 text-xs">
            <span v-tippy="selectedSafe.safe_address">
              {{ shortenHash(selectedSafe.safe_address) }}
            </span>
            <Copy icon-class="w-3 h-3" :text="selectedSafe.safe_address" icon-only />
          </dd>
        </dl>
        <dl class="flex">
          <dt class="basis-52 text-xs text-gray-400">
            New signers
          </dt>
          <dd class="flex items-center gap-2 text-xs">
            <ul class="flex flex-col gap-4">
              <li v-for="item in uniqueAddresses" :key="item.address" class="flex gap-2.5 leading-5">
                <AuthorityAvatar :address="item.address" />
                <div>
                  <span v-if="item.name">
                    {{ item.name }}
                  </span>
                  <button v-else type="button" @click="openAddContactModal(undefined, item.address)">
                    Save as Contact
                  </button>
                  <div class="flex items-center gap-2 text-gray-400">
                    <span v-tippy="item.address">
                      {{ shortenHash(item.address) }}
                    </span>
                    <Copy icon-class="!w-3 !h-3" :text="item.address" icon-only />
                  </div>
                </div>
              </li>
            </ul>
          </dd>
        </dl>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 border-t border-gray-875 p-5 sm:grid-cols-2 sm:px-7.5 sm:pb-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>
      <CommonButton class="justify-center" size="lg" @click="handleContinue">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
