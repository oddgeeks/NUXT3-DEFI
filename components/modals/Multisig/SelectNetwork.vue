<script lang="ts" setup>
import { major } from 'semver'

const props = defineProps<{
  addresses: ISignerAddress[]
  defaultSelectedNetworks?: number[]
  defaultThreshold?: number
  gnosisAddress?: string
}>()

const emit = defineEmits(['destroy', 'resolve'])
const { safeOptions } = storeToRefs(useSafe())

const steps = useState<SignerSteps>('signer-steps')

const selectedNetworks = ref<number[]>(props.defaultSelectedNetworks || [])

const deployedNetworks = computed(() => safeOptions.value?.filter(option => gte(major(option?.currentVersion || '0.0.0'), 1)))
const nonDeployedNetworks = computed(() => safeOptions.value?.filter(option => lt(major(option?.currentVersion || '0.0.0'), 1)))

function toggleNetworkChainId(chainId: number | string) {
  if (selectedNetworks.value.includes(Number(chainId)))
    selectedNetworks.value = selectedNetworks.value.filter(id => id !== chainId)
  else
    selectedNetworks.value = [...selectedNetworks.value, Number(chainId)]
}

function isSelected(chainId: number | string) {
  return selectedNetworks.value.includes(Number(chainId))
}

function handleSelectAll() {
  selectedNetworks.value = availableNetworks.map(i => i.chainId)
}

function handleDeselectAll() {
  selectedNetworks.value = []
}

function handleSubmit() {
  steps.value.currentStep += 1
  emit('destroy')
  openSignSignerModal(props.addresses, selectedNetworks.value, props.gnosisAddress, props.defaultThreshold)
}

function handleBack() {
  steps.value.currentStep -= 1
  emit('destroy')

  openReviewSignerModal({
    addresses: props.addresses,
    gnosisAddress: props.gnosisAddress,
    defaultSelectedNetworks: props.defaultSelectedNetworks,
    defaultThreshold: props.defaultThreshold,
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5">
      <Steps class="mr-10" :total-steps="steps?.totalSteps" :current-step=" steps?.currentStep" />
      <div class="flex gap-[14px]">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white">
          {{ steps.currentStep }}
        </div>
        <div class="flex gap-1">
          <h1>
            Select networks where new signers will be added
          </h1>
        </div>
      </div>
    </div>
    <hr class="border-gray-800">
    <div class="px-6 py-5 sm:p-7.5">
      <button v-if="selectedNetworks.length === availableNetworks.length" class="absolute right-7.5 text-xs text-primary" type="button" @click="handleDeselectAll">
        Deselect all
      </button>

      <button v-else class="absolute right-7.5 text-xs text-primary" type="button" @click="handleSelectAll">
        Select all
      </button>
      <template v-if="deployedNetworks?.length">
        <h2 class="mb-4 text-sm">
          Deployed
        </h2>
        <ul class="mb-4 flex flex-col gap-4">
          <MultisigSelectNetworkItem v-for="option in deployedNetworks" :key="option.chainId" :addresses="addresses" :selected="isSelected(option.chainId)" :option="option" @on-select="toggleNetworkChainId(option.chainId)" />
        </ul>
      </template>
      <template v-if="nonDeployedNetworks?.length">
        <h2 class="mb-4 flex items-center gap-2.5 text-sm">
          Not deployed <SvgoInfo2 v-tippy="'You can also deploy anytime in future on any chain at the same address'" class="text-gray-500" />
        </h2>
        <ul class="flex flex-col gap-4">
          <MultisigSelectNetworkItem v-for="option in nonDeployedNetworks" :key="option.chainId" :addresses="addresses" :selected="isSelected(option.chainId)" :option="option" @on-select="toggleNetworkChainId(option.chainId)" />
        </ul>
      </template>
    </div>
    <hr class="border-gray-800">
    <div class="grid grid-cols-2 gap-4 p-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton :disabled="!selectedNetworks.length" type="submit" class="justify-center" size="lg">
        Proceed
      </CommonButton>
    </div>
  </form>
</template>
