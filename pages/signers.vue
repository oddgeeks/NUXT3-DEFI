<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { selectedSafe } = storeToRefs(useSafe())
const { requiredSigners } = storeToRefs(useMultisig())
const { changeThreshold } = useAvocadoSafe()

async function handleTresholdChange(chainId: string | number) {
  const { success, payload } = await openUpdateThresholdModal(chainId, 0)

  if (success && payload) {
    const txHash = await changeThreshold(payload, chainId)

    if (txHash)
      showPendingTransactionModal(txHash, chainId)
  }
}
</script>

<template>
  <div class="flex flex-col gap-10 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Multisig Signers
      </h2>
      <span class="text-xs text-slate-400 leading-5">
        Signers are addresses that are required to sign transactions before they can be executed on the blockchain.
      </span>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-[25px]">
        <template v-for="addresses, chainId in selectedSafe?.signers || {}" :key="chainId">
          <div v-if="addresses.length" class="rounded-t-[inherit]">
            <h2 class="dark:bg-slate-850 rounded-t-[inherit] bg-slate-150 py-2.5 flex items-center gap-2.5 px-5 text-xs font-medium leading-5 text-slate-400">
              <ChainLogo class="w-5 h-5" :chain="chainId" />
              {{ chainIdToName(chainId) }}
            </h2>
            <MultisigSafeItems :addresses="addresses" :chain-id="chainId" />
          </div>
        </template>
        <div class="flex py-6.5 px-7.5 border-t-1 border-slate-150 dark:border-slate-800">
          <button class="flex items-center text-primary gap-3" @click="openAddSignerModal()">
            <div class="bg-primary w-5 h-5 rounded-full flex">
              <SvgoPlus class="text-white m-auto w-2 h-2" />
            </div>
            Add New Signer
          </button>
        </div>
      </div>
    </div>
    <div>
      <h2 class="mb-2.5">
        Required confirmations
      </h2>
      <p class="text-xs text-slate-400 mb-5">
        Any transaction requires the confirmation of:
      </p>
      <div v-if="requiredSigners.length" class="dark:bg-gray-850 bg-slate-100 px-7.5 py-[26px] text-sm rounded-[25px]">
        <span v-for="item of requiredSigners" :key="item.chainId" class="flex items-center gap-2.5">
          <ChainLogo class="w-5 h-5" :chain="item.chainId" />
          <span>
            {{ item.requiredSignerCount }} out of {{ item.signerCount }}
          </span>
          <button class="text-primary ml-4" @click="handleTresholdChange(item.chainId)">
            Change
          </button>
        </span>
      </div>
    </div>
  </div>
</template>
