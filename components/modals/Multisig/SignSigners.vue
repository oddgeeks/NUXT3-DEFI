<script setup lang="ts">
defineProps<{
  chainSigners: ChainSigners
}>()

const emit = defineEmits(['destroy', 'resolve'])
const signs = ref<boolean[]>([])

function handleBack() {
  emit('destroy')
}

function formatAddress(addresses: string[]): ISignerAddress[] {
  return addresses.map((i) => {
    return {
      name: '',
      address: i,
    }
  })
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-5 border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <Steps :total-steps="2" :current-step="2" />
      <ModalTitle class="items-center">
        <template #icon>
          2
        </template>
        <template #title>
          Sign on all the networks to proceed
        </template>
      </ModalTitle>
    </div>

    <div class="px-7.5 py-5 sm:px-7.5">
      <ul class="flex flex-col gap-7">
        <template v-for="addresses, chainId in chainSigners" :key="chainId">
          <MultisigSignAddSignerItem v-if="addresses.length" v-model="signs" :chain-id="chainId" :addresses="formatAddress(addresses)" />
        </template>
      </ul>
    </div>

    <div class="grid grid-cols-2 gap-4 border-t border-gray-875 py-5 sm:px-7.5 sm:pb-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Cancel
      </CommonButton>
      <CommonButton class="justify-center" size="lg" @click="$emit('resolve', true)">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
