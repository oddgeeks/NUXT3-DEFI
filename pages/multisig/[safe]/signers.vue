<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'

const route = useRoute()
const { getSafe } = useSafe()

if (!route.params.safe || !isAddress(route.params.safe as string))
  throw new Error('Safe address is required')

function defaultSteps() {
  return {
    currentStep: 1,
    totalSteps: 4,
  }
}

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const addedSigners = ref<ChainSigners>({})

const signerSteps = useState('signer-steps', defaultSteps)

const hasUnsavedChanges = computed(() => Object.values(addedSigners.value || {}).some(i => !!i.length))

const navigation = [
  {
    label: 'Add New Signer',
    icon: 'SvgoPlusCircle',
    class: 'text-primary',
    click: handleAddSigner,
  },
  {
    label: 'Delete Signers',
    icon: 'SvgoTrash2',
    class: 'text-red-alert',
    click: handleDeleteSigner,
  },
  {
    label: 'Copy Multisig setup between Networks',
    icon: 'SvgoCopy',
    click: openCopyMultisigSettingsModal,
  },
  {
    label: 'Clone Gnosis Settings',
    icon: 'SvgoSafe',
    click: handleGnosisSetup,
  },
]

const { data, execute } = useAsyncData(
  `${route.params.safe}-signers`,
  async () => {
    const safe = await getSafe(route.params.safe as string)

    if (!safe)
      return

    const arr = Object.keys(safe.signers).map(key => ({ chainId: key, addresses: safe.signers[key] }))

    // Sort the array based on the length of the value arrays
    arr.sort((a, b) => b.addresses.length - a.addresses.length)

    return {
      safe,
      formattedSigners: arr,
    }
  },
)

useIntervalFn(() => {
  execute()
}, 10000)

function clearState() {
  for (const network of availableNetworks) {
    clearNuxtState(`signed-${network.chainId}`)
    clearNuxtState(`executed-${network.chainId}`)
  }
}

function handleGnosisSetup() {
  signerSteps.value.currentStep = 1
  signerSteps.value.totalSteps = 5

  openFetchGnosisSafeModal()
}

function handleAddSigner() {
  clearState()
  signerSteps.value.currentStep = 1
  signerSteps.value.totalSteps = 4

  openAddSignerModal()
}

function handleDeleteSigner() {
  openDeleteSignersModal()
}

function handleProceed() {
  clearState()

  openReviewSignersModal(addedSigners.value)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-7.5">
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-2.5">
        <h1 class="text-3xl/10 font-bold">
          Manage Multisig Signers
        </h1>
        <h2 class="text-sm text-gray-400 sm:max-w-lg">
          Signers are addresses that are required to sign transactions before they can be executed on the blockchain.
        </h2>
      </div>
      <div class="flex items-center justify-between">
        <ul class="flex items-center gap-2.5">
          <li v-for="item in navigation" :key="item.label">
            <button :class="item.class" type="button" class="flex items-center gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-xs" @click="item.click">
              <Component :is="item.icon" class="h-4.5 w-4.5" />
              {{ item.label }}
            </button>
          </li>
        </ul>
        <CommonButton :disabled="!hasUnsavedChanges" @click="handleProceed">
          Submit Changes
        </CommonButton>
      </div>
    </div>
    <div v-if="data" class="grid grid-cols-3 gap-4.5">
      <template v-for="item of data.formattedSigners" :key="item.chainId">
        <MultisigSignerCard v-model="addedSigners" :safe="data.safe" :chain-id="item.chainId" />
      </template>
    </div>
    <CommonNotification v-if="hasUnsavedChanges" type="warning" class="flex w-fit gap-5 !rounded-2xl">
      <div class="flex gap-2.5 text-xs/5">
        <SvgoInfo2 class="mt-1" />
        You have unsaved changes to your Multisig <br>Signers. Click Proceed to finalized changeds.
      </div>
      <CommonButton class="py-[5px]" size="sm" @click="handleProceed">
        Proceed
      </CommonButton>
    </CommonNotification>
  </div>
</template>
