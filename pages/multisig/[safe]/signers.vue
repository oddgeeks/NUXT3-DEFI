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
const { account } = useWeb3()

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

    const metadata = encodeRemoveSignersMetadata(addresses)

    const txHash = await removeSignerWithThreshold({
      addresses,
      chainId: selectedChainId.value,
      threshold,
    })

    if (txHash) {
      logActionToSlack({
        action: 'remove-signers',
        account: account.value,
        txHash,
        message: generateSlackMessage(metadata, selectedChainId.value),
        chainId: String(selectedChainId.value),
      })
      showPendingTransactionModal(txHash, selectedChainId.value)
    }

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
  <div class="flex flex-1 flex-col gap-5 sm:gap-10">
    <div class="flex flex-col gap-2.5">
      <h2 class="text-base">
        Manage Multisig Signers
      </h2>
      <div class="flex flex-wrap justify-between gap-5">
        <span class="text-xs leading-5 text-slate-400">
          Signers are addresses that are required to sign transactions before they can be executed on<br> the blockchain.
        </span>
        <fieldset :disabled="isSafeDoesNotMatch" class="flex w-full items-center justify-between gap-7.5 self-start sm:w-auto">
          <button class="flex items-center gap-2.5 whitespace-nowrap text-xs text-primary disabled:text-slate-400" @click="handleAddSignerModal()">
            <div class="flex h-4.5 w-4.5 rounded-full bg-current">
              <SvgoPlus class="m-auto h-2 w-2 text-white" />
            </div>
            Add New Signer(s)
          </button>
          <button :disabled="!selectedAddresses.length" class="flex items-center gap-2.5 whitespace-nowrap text-xs text-red-alert disabled:text-slate-400" @click="handleDeleteSigner">
            Delete Selected
            <SvgoTrash2 class="h-3.5 w-3.5" />
          </button>
        </fieldset>
      </div>
      <div v-if="!isSafeDoesNotMatch" class="mb-2.5 flex items-center justify-between rounded-[25px] bg-slate-50 p-[18px] font-medium dark:bg-gray-850 sm:px-7.5 sm:py-6.5">
        <div class="flex items-center gap-3">
          <SvgoSafe class="h-7.5 w-7.5" />
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
