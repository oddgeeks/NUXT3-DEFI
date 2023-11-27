<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())

function getSortedChain(reverse = false) {
  return Object.entries(selectedSafe.value?.signers || {}).map(([chainId, addresses]) => ({
    chainId,
    addresses: addresses.length,
  })).sort((a, b) => reverse ? b.addresses - a.addresses : a.addresses - b.addresses)[0]
}

const sourceChainId = ref(getSortedChain(true)?.chainId)
const targetChainId = ref(getSortedChain(false)?.chainId)

const sourceSigners = computed(() => selectedSafe.value?.signers[sourceChainId.value] || [])

function handleSelectNetwork() {
  console.log('selam')
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-5 border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <ModalTitle class="items-center">
        <template #icon>
          <SvgoCopy class="header-icon" />
        </template>
        <template #title>
          Copy Multisig settings between Networks
        </template>
      </ModalTitle>
    </div>

    <div class="px-7.5 py-5 sm:px-7.5">
      <div class="flex flex-col gap-2.5">
        <h2 class="flex items-center gap-2 text-xs">
          <SvgoUpload />
          Copy Settings from
        </h2>
        <div class="rounded-2xl bg-gray-850 text-sm">
          <button class="flex w-full items-center border-b border-gray-875 px-4 py-[14px]">
            <div class="flex items-center gap-3">
              <ChainLogo class="h-7.5 w-7.5" :chain="sourceChainId" />
              {{ chainIdToName(sourceChainId) }}
            </div>
            <SvgoChevronDown class="ml-2 h-4 w-4 -rotate-90" />
          </button>
          <ul>
            <li v-for="signer in sourceSigners" :key="signer" class="border-b border-gray-875 px-4 py-[14px] last:border-b-0">
              {{ signer }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 border-t border-gray-875 py-5 sm:px-7.5 sm:pb-7.5">
      <CommonButton class="justify-center" size="lg" color="white">
        Cancel
      </CommonButton>
      <CommonButton class="justify-center" size="lg" @click="$emit('resolve', true)">
        Continue
      </CommonButton>
    </div>
  </div>
</template>

<style>
.header-icon > .copy_svg__copy-path {
  @apply fill-primary;
}
</style>
