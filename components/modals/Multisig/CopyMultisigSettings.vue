<script setup lang="ts">
const emits = defineEmits(['destroy'])
const { selectedSafe } = storeToRefs(useSafe())
const { getContactNameByAddress } = useContacts()
const { addSignersWithThreshold, removeSignerWithThreshold, createProposalOrSignDirecty } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
function getSortedChain(reverse = false) {
  return Object.entries(selectedSafe.value?.signers || {}).map(([chainId, addresses]) => ({
    chainId,
    addresses: addresses.length,
  })).sort((a, b) => reverse ? b.addresses - a.addresses : a.addresses - b.addresses)[0]
}

const sourceChainId = ref(getSortedChain(true)?.chainId)
const targetChainId = ref(getSortedChain(false)?.chainId)
const pending = ref(false)

const { getRequiredSigner } = useMultisig()

const sourceThreshold = asyncComputed(() => getRequiredSigner(selectedSafe.value?.safe_address!, sourceChainId.value))

const sourceSigners = computed(() => selectedSafe.value?.signers[sourceChainId.value] || [])

const targetSigners = computed(() => selectedSafe.value?.signers[targetChainId.value] || [])

const signersWillbeAdded = computed(() => sourceSigners.value.filter(i => !targetSigners.value.includes(i))
  .filter(i => !isAddressEqual(i, selectedSafe.value?.owner_address)))

const signersWillbeDeleted = computed(() => targetSigners.value.filter(i => !sourceSigners.value.includes(i))
  .filter(i => !isAddressEqual(i, selectedSafe.value?.owner_address)),
)

async function handleApply() {
  try {
    const addedSignersWithoutOwner = signersWillbeAdded.value
      .map((i) => {
        return {
          address: i,
          name: getContactNameByAddress(i) || '',
        }
      })

    const addSignerActions = addedSignersWithoutOwner?.length
      ? await addSignersWithThreshold({
        chainId: targetChainId.value,
        threshold: sourceThreshold.value,
        addresses: addedSignersWithoutOwner,
        actionsOnly: true,
      })
      : []

    const deleteSignerActions = signersWillbeDeleted.value?.length
      ? await removeSignerWithThreshold({
        chainId: targetChainId.value,
        addresses: signersWillbeDeleted.value,
        actionsOnly: true,
      })
      : []

    const actions = [...deleteSignerActions?.actions || [], ...addSignerActions?.actions || []]

    const encodedMetadata = [encodeChangeThresholdMetadata(sourceThreshold.value, false)]

    if (signersWillbeDeleted.value?.length)
      encodedMetadata.push(encodeRemoveSignersMetadata(signersWillbeDeleted.value, false))

    if (addedSignersWithoutOwner?.length)
      encodedMetadata.push(encodeAddSignersMetadata(addedSignersWithoutOwner.map(i => i.address), false))

    const metadata = encodeMultipleActions(...encodedMetadata)

    const txHash = await createProposalOrSignDirecty({ chainId: targetChainId.value, actions, estimatedFee: true, metadata, clearModals: true })

    if (txHash) {
      showPendingTransactionModal({ chainId: targetChainId.value, hash: txHash })
      emits('destroy')
    }
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)
    openSnackbar({
      type: 'error',
      message: parsed?.formatted,
    })
  }
  finally {
    pending.value = false
  }
}

async function handleChangeNetwork(source = false) {
  const { success, payload: chainId } = await openSelectMultisigNetworkModal(source ? targetChainId.value : sourceChainId.value)

  if (!success)
    return

  if (source)
    sourceChainId.value = chainId
  else
    targetChainId.value = chainId
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

    <div class="flex flex-col gap-5 px-7.5 py-5 sm:px-7.5">
      <div class="flex flex-col gap-2.5">
        <h2 class="flex items-center gap-2 text-xs">
          <SvgoUpload />
          Copy Settings from
        </h2>
        <div class="rounded-2xl bg-gray-850 text-sm">
          <button class="flex w-full items-center border-b border-gray-875 px-4 py-[14px]" @click="handleChangeNetwork(true)">
            <div class="flex items-center gap-3">
              <ChainLogo class="h-7.5 w-7.5" :chain="sourceChainId" />
              {{ chainIdToName(sourceChainId) }}
            </div>
            <SvgoChevronDown class="ml-2 h-4 w-4 -rotate-90" />
          </button>
          <ul>
            <li v-for="signer in sourceSigners" :key="signer" class="flex gap-3 border-b border-gray-875 p-2.5 last:border-b-0 sm:px-4 sm:py-[14px]">
              <AuthorityAvatar class="h-7.5 w-7.5" :address="signer" />
              <div class="flex flex-col gap-1">
                <span v-if="getContactNameByAddress(signer)" class="max-w-[150px] truncate whitespace-nowrap text-xs">
                  {{ getContactNameByAddress(signer) }}
                </span>
                <button v-else class="text-left text-xs font-medium text-primary" @click="openAddContactModal(undefined, signer)">
                  Save as Contact
                </button>
                <span class="text-xs text-gray-400">
                  {{ shortenHash(signer, 9) }}
                </span>
              </div>
            </li>
            <li class="flex flex-col gap-3 border-b border-gray-875 px-4 py-[14px] last:border-b-0">
              <span class="text-xs text-gray-400">
                Any transaction requires the confirmation of:
              </span>
              <div class="flex items-center gap-2.5">
                <SvgoUserCircle class="h-4.5 w-4.5" />
                <span>{{ sourceThreshold }} out of {{ sourceSigners.length || 1 }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div class="flex flex-col gap-2.5">
        <h2 class="flex items-center gap-2 text-xs">
          <SvgoUpload />
          Apply to
        </h2>
        <div class="rounded-2xl bg-gray-850 text-sm">
          <button class="flex w-full items-center px-4 pt-[14px]" @click="handleChangeNetwork(false)">
            <div class="flex items-center gap-3">
              <ChainLogo class="h-7.5 w-7.5" :chain="targetChainId" />
              {{ chainIdToName(targetChainId) }}
            </div>
            <SvgoChevronDown class="ml-2 h-4 w-4 -rotate-90" />
          </button>
          <ul class="m-4 rounded-2xl border border-gray-800">
            <li class="flex gap-3 border-b border-gray-875 px-4 py-[14px] text-xs text-gray-400 last:border-b-0">
              Adding Signers
            </li>

            <li v-if="!signersWillbeAdded.length" class="flex gap-3 px-4 py-[14px] text-sm">
              No Signers will be added
            </li>
            <li v-for="signer in signersWillbeAdded" :key="signer" class="flex gap-3 border-b border-gray-875 p-2.5 last:border-b-0 sm:px-4 sm:py-[14px]">
              <AuthorityAvatar class="h-7.5 w-7.5" :address="signer" />
              <div class="flex flex-col gap-1">
                <span v-if="getContactNameByAddress(signer)" class="max-w-[150px] truncate whitespace-nowrap text-xs">
                  {{ getContactNameByAddress(signer) }}
                </span>
                <button v-else class="text-left text-xs font-medium text-primary" @click="openAddContactModal(undefined, signer)">
                  Save as Contact
                </button>
                <span class="text-xs text-gray-400">
                  {{ shortenHash(signer, 9) }}
                </span>
              </div>
            </li>
            <li class="flex justify-between px-4 py-[14px]">
              Changing Treshold

              <span>{{ sourceThreshold }} out of {{ sourceSigners.length || 1 }}</span>
            </li>
          </ul>
          <ul v-if="signersWillbeDeleted?.length" class="m-4 rounded-2xl border border-gray-800">
            <li class="flex gap-3 border-b border-gray-875 px-4 py-[14px] text-xs text-gray-400 last:border-b-0">
              Deleted Signers
            </li>
            <li v-for="signer in signersWillbeDeleted" :key="signer" class="flex gap-3 border-b border-gray-875 p-2.5 last:border-b-0 sm:px-4 sm:py-[14px]">
              <AuthorityAvatar class="h-7.5 w-7.5" :address="signer" />
              <div class="flex flex-col gap-1">
                <span v-if="getContactNameByAddress(signer)" class="max-w-[150px] truncate whitespace-nowrap text-xs">
                  {{ getContactNameByAddress(signer) }}
                </span>
                <button v-else class="text-left text-xs font-medium text-primary" @click="openAddContactModal(undefined, signer)">
                  Save as Contact
                </button>
                <span class="text-xs text-gray-400">
                  {{ shortenHash(signer, 9) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 border-t border-gray-875 p-5 sm:grid-cols-2 sm:px-7.5 sm:pb-7.5">
      <CommonButton class="justify-center" size="lg" color="white">
        Cancel
      </CommonButton>
      <CommonButton :disabled="!signersWillbeDeleted?.length && !signersWillbeAdded.length" :loading="pending" class="justify-center" size="lg" @click="handleApply">
        Apply
      </CommonButton>
    </div>
  </div>
</template>

<style>
.header-icon > .copy_svg__copy-path {
  @apply fill-primary;
}
</style>
