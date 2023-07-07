<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { selectedSafe } = storeToRefs(useSafe())
const { setSelectedSafe } = useSafe()
const { requiredSigners } = storeToRefs(useMultisig())
const { changeThreshold, removeSignerWithThreshold } = useAvocadoSafe()

const selectedAddresses = ref<string[]>([])
const selectedChainId = ref<string | number>()

provide('selectedAddresses', selectedAddresses)
provide('selectedChainId', selectedChainId)

function getSignerInfo(chainId: string | number) {
  return requiredSigners.value.find((signer: any) => signer.chainId == chainId)
}

async function handleTresholdChange(chainId: string | number) {
  const { success, payload } = await openUpdateThresholdModal(chainId, 0)

  if (success && payload) {
    const txHash = await changeThreshold(payload, chainId)

    if (txHash)
      showPendingTransactionModal(txHash, chainId)
  }
}

async function handleDeleteSigner() {
  if (!selectedChainId.value)
    return

  const { success, payload: addresses } = await openDeleteSigner(selectedAddresses.value, selectedChainId.value)

  if (success && addresses) {
    const { payload: threshold, success: thresholdSuccess } = await openUpdateThresholdModal(selectedChainId.value, addresses.length * -1)

    if (!thresholdSuccess)
      return

    const txHash = await removeSignerWithThreshold(addresses, selectedChainId.value, threshold)

    if (txHash)
      showPendingTransactionModal(txHash, selectedChainId.value)

    selectedAddresses.value = []
    selectedChainId.value = undefined
  }
}

useIntervalFn(() => {
  setSelectedSafe()
}, 15000)
</script>

<template>
  <div class="flex flex-col gap-10 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Multisig Signers
      </h2>
      <div class="flex justify-between">
        <span class="text-xs text-slate-400 leading-5">
          Signers are addresses that are required to sign transactions before they can be executed on<br> the blockchain.
        </span>
        <fieldset class="flex items-center gap-7.5">
          <button class="flex items-center text-xs disabled:text-slate-400 text-primary gap-2.5" @click="openAddSignerModal()">
            <div class="bg-current w-4.5 h-4.5 rounded-full flex">
              <SvgoPlus class="text-white m-auto w-2 h-2" />
            </div>
            Add New Signer
          </button>
          <button :disabled="!selectedAddresses.length" class="flex disabled:text-slate-400 items-center text-xs text-red-alert gap-2.5" @click="handleDeleteSigner">
            Delete Selected
            <SvgoTrash2 class="w-3.5 h-3.5" />
          </button>
        </fieldset>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-[25px]">
        <template v-for="addresses, chainId in selectedSafe?.signers || {}" :key="chainId">
          <details v-if="addresses.length" open class="rounded-t-[inherit] group">
            <summary class="flex items-center justify-between py-6.5 px-7.5 cursor-pointer group-open:border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800">
              <h2 class="flex items-center gap-3">
                <ChainLogo class="w-7.5 h-7.5" :chain="chainId" />
                {{ chainIdToName(chainId) }}
              </h2>
              <div class="flex flex-1 justify-between self-end gap-[142px]">
                <div class="flex items-center gap-[100px] flex-1 justify-end text-sm text-slate-400 font-medium">
                  <span class="flex items-center gap-2.5">
                    <SvgoUsers />
                    {{ getSignerInfo(chainId)?.signerCount }} total signers</span>
                  <span class="flex items-center gap-2.5">
                    <SvgoStamp />
                    {{ getSignerInfo(chainId)?.requiredSignerCount }} confirmations required</span>
                </div>
                <SvgoChevronDown class="w-5 text-slate-400 group-open:rotate-180" />
              </div>
            </summary>
            <MultisigSafeItems :addresses="addresses" :chain-id="chainId" />
            <div class="flex flex-col gap-4 py-6.5 px-7.5">
              <h2 class="text-xs font-medium text-slate-400">
                Any transaction requires the confirmation of:
              </h2>

              <span v-for="item of requiredSigners" :key="item.chainId" class="flex items-center gap-2.5">
                <SvgoUserCircle class="text-slate-400" />
                <span>
                  {{ item.requiredSignerCount }} out of {{ item.signerCount }}
                </span>
                <button class="text-primary ml-4 text-xs" @click="handleTresholdChange(item.chainId)">
                  Change
                </button>
              </span>
            </div>
          </details>
        </template>
      </div>
    </div>
  </div>
</template>
