<script setup lang="ts">
import { getAddress, isAddress } from 'ethers/lib/utils'

const route = useRoute()

if (!route.params.safe || !isAddress(route.params.safe as string))
  throw new Error('Safe address is required')

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { getSafe } = useSafe()
const { selectedSafe } = storeToRefs(useSafe())
const { removeSignerWithThreshold } = useAvocadoSafe()

const selectedAddresses = ref<string[]>([])
const selectedChainId = ref<string | number>()

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

const signerSteps = useState('signer-steps', defaultSteps)

const isSafeDoesNotMatch = computed(() => {
  const safe = route.params.safe as string
  if (!selectedSafe.value || !safe)
    return true

  return getAddress(safe) !== getAddress(selectedSafe.value?.safe_address)
})

const { data: multisigSafe } = useAsyncData(`${route.params.safe}-signers`, async () => {
  const safeAddress = route.params.safe as string
  const safe = await getSafe(safeAddress)

  return safe
}, {
  server: false,
  immediate: true,
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

async function handleDeleteSigner() {
  if (!selectedChainId.value)
    return

  const { success, payload: addresses } = await openDeleteSigner(selectedAddresses.value, selectedChainId.value)

  if (success && addresses) {
    const { payload: threshold, success: thresholdSuccess } = await openUpdateThresholdModal(selectedChainId.value, addresses.length * -1, {
      activeStep: 2,
      totalSteps: 3,
    })

    if (!thresholdSuccess)
      return

    const txHash = await removeSignerWithThreshold(addresses, selectedChainId.value, threshold)

    if (txHash)
      showPendingTransactionModal(txHash, selectedChainId.value)

    selectedAddresses.value = []
    selectedChainId.value = undefined
  }
}

function handleAddSignerModal() {
  // clear all signed states
  for (const network of availableNetworks) {
    clearNuxtState(`signed-${network.chainId}`)
    clearNuxtState(`executed-${network.chainId}`)
  }

  signerSteps.value.currentStep = 1
  signerSteps.value.totalSteps = 4

  openAddSignerModal()
}

function handleGnosisSetup() {
  signerSteps.value.currentStep = 1
  signerSteps.value.totalSteps = 5

  openFetchGnosisSafeModal()
}

watch(selectedAddresses, () => {
  setTimeout(() => {
    if (selectedAddresses.value.length === 0)
      selectedChainId.value = undefined
  }, 0)
})

onMounted(() => {
  signerSteps.value = defaultSteps()
})
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
          <button class="flex items-center text-xs disabled:text-slate-400 text-primary gap-2.5 whitespace-nowrap" @click="handleAddSignerModal()">
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
      <div class="dark:bg-gray-850 mb-2.5 justify-between font-medium flex bg-slate-50 p-[18px] rounded-[25px] sm:py-6.5 sm:px-7.5 items-center">
        <div class="flex gap-3 items-center">
          <SvgoSafe class="w-7.5 h-7.5" />
          <div class="flex flex-col gap-1.5">
            Clone your existing Safe on Avocado in just 1 click!
          </div>
        </div>
        <CommonButton @click="handleGnosisSetup">
          Setup Now
        </CommonButton>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-5">
        <template v-for="item in availableSigners" :key="item.chainId">
          <MultisigSignersItem v-if="multisigSafe" :chain-id="item.chainId" :multisig-safe="multisigSafe" :item="item" />
        </template>
      </div>
    </div>
  </div>
</template>
