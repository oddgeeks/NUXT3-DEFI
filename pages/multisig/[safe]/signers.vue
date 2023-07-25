<script setup lang="ts">
import { getAddress, isAddress } from 'ethers/lib/utils'

interface IAvailableSigner {
  chainId: string | number
  addresses: string[]
}

const route = useRoute()

if (!route.params.safe || !isAddress(route.params.safe as string))
  throw new Error('Safe address is required')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { fetchSafe } = useSafe()
const { account } = useWeb3()
const { selectedSafe } = storeToRefs(useSafe())
const { getRequiredSigners, setRequiredSigners, isAccountCanSign } = useMultisig()
const { changeThreshold, removeSignerWithThreshold } = useAvocadoSafe()

const selectedAddresses = ref<string[]>([])
const selectedChainId = ref<string | number>()

const isSafeDoesNotMatch = computed(() => {
  const safe = route.params.safe as string
  if (!selectedSafe.value || !safe)
    return true

  return getAddress(safe) !== getAddress(selectedSafe.value?.safe_address)
})

const { data: multisigSafe, refresh } = useAsyncData<ISafe>(`${route.params.safe}-signers`, async () => {
  const safeAddress = route.params.safe as string
  const resp = await fetchSafe(safeAddress)

  return resp
})

const { data: requiredSigners } = useAsyncData(`${route.params.safe}-required-signers`, async () => {
  if (!multisigSafe.value)
    return

  return getRequiredSigners(multisigSafe.value)
}, {
  watch: [multisigSafe],
  server: false,
})

const availableSigners = computed(() => {
  if (!multisigSafe?.value)
    return []

  const signers = multisigSafe?.value?.signers || {}

  return Object.entries(signers).reduce<IAvailableSigner[]>((acc, [chainId, addresses]) => {
    if (addresses.length) {
      acc.push({
        chainId,
        addresses,
      })
    }

    return acc
  }, [])
})

provide('selectedAddresses', selectedAddresses)
provide('selectedChainId', selectedChainId)

function getSignerInfo(chainId: string | number) {
  return requiredSigners.value?.find((signer: any) => signer.chainId == chainId)
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

watch(selectedAddresses, () => {
  setTimeout(() => {
    if (selectedAddresses.value.length === 0)
      selectedChainId.value = undefined
  }, 0)
})

useIntervalFn(async () => {
  setRequiredSigners()
  refresh()
}, 5000)
</script>

<template>
  <div class="flex flex-col sm:gap-10 gap-5 flex-1">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Multisig Signers
      </h2>
      <div class="flex justify-between flex-wrap gap-5">
        <span class="text-xs text-slate-400 leading-5">
          Signers are addresses that are required to sign transactions before they can be executed on<br> the blockchain.
        </span>
        <fieldset :disabled="isSafeDoesNotMatch" class="flex items-center gap-7.5 sm:w-auto w-full justify-between self-start">
          <button class="flex items-center text-xs disabled:text-slate-400 text-primary gap-2.5 whitespace-nowrap" @click="openAddSignerModal()">
            <div class="bg-current w-4.5 h-4.5 rounded-full flex">
              <SvgoPlus class="text-white m-auto w-2 h-2" />
            </div>
            Add New Signer(s)
          </button>
          <button :disabled="!selectedAddresses.length" class="flex whitespace-nowrap disabled:text-slate-400 items-center text-xs text-red-alert gap-2.5" @click="handleDeleteSigner">
            Delete Selected
            <SvgoTrash2 class="w-3.5 h-3.5" />
          </button>
        </fieldset>
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-5">
        <template v-for="item, i in availableSigners" :key="item.chainId">
          <details class="rounded-[25px] group text-sm dark:bg-gray-850 bg-slate-50">
            <summary class="flex justify-between flex-wrap sm:gap-0 gap-4.5 p-[18px] sm:py-6.5 sm:px-7.5 cursor-pointer group-open:border-b-1 last:border-b-0 border-slate-150 dark:border-slate-800 items-center">
              <h2 class="flex items-center gap-3 sm:w-auto w-full">
                <ChainLogo class="w-7.5 h-7.5" :chain="item.chainId" />
                {{ chainIdToName(item.chainId) }}
                <SvgoChevronDown class="w-5 shrink-0 sm:hidden block ml-auto text-slate-400 group-open:rotate-180" />
              </h2>
              <div class="flex flex-wrap flex-1 justify-between sm:gap-[142px] items-center">
                <div class="flex items-center sm:gap-[100px] gap-5 flex-1 justify-end text-sm text-slate-400 font-medium">
                  <div v-if="!getSignerInfo(item.chainId)" class="loading-box rounded-5 w-36 h-5" />
                  <span v-else class="flex items-center gap-2.5">
                    <SvgoUsers class="shrink-0" />
                    {{ getSignerInfo(item.chainId)?.signerCount }}
                    <span class="sm:block hidden">total signers</span>
                    <span class="sm:hidden block whitespace-nowrap">total sign.</span>
                  </span>
                  <div v-if="!getSignerInfo(item.chainId)" class="loading-box rounded-5 w-36 h-5" />
                  <span v-else class="flex items-center gap-2.5">
                    <SvgoStamp />
                    {{ getSignerInfo(item.chainId)?.requiredSignerCount }}
                    <span class="sm:block hidden">confirmations required</span>
                    <span class="sm:hidden block whitespace-nowrap">confirm. req.</span>
                  </span>
                </div>
                <SvgoChevronDown class="w-5 hidden sm:block shrink-0 text-slate-400 group-open:rotate-180" />
              </div>
            </summary>
            <MultisigSafeItems v-if="multisigSafe" :multisig-safe="multisigSafe" :addresses="item.addresses" :chain-id="item.chainId" />
            <div class="flex flex-col gap-4 px-[18px] py-5 sm:py-6.5 sm:px-7.5">
              <h2 class="text-xs font-medium text-slate-400">
                Any transaction requires the confirmation of:
              </h2>

              <div v-if="!getSignerInfo(item.chainId)" class="loading-box rounded-5 w-36 h-5" />

              <span v-else class="flex items-center gap-2.5 sm:text-sm text-xs">
                <SvgoUserCircle class="text-slate-400" />
                <span>
                  {{ getSignerInfo(item.chainId)?.requiredSignerCount }} out of {{ getSignerInfo(item.chainId)?.signerCount }}
                </span>
                <button :disabled="isSafeDoesNotMatch || !isAccountCanSign(item.chainId, account, selectedSafe?.owner_address)" class="text-primary disabled:text-slate-400 ml-4 text-xs" @click="handleTresholdChange(item.chainId)">
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
