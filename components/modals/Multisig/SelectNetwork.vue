<script lang="ts" setup>
import { major } from 'semver'

const props = defineProps<{
  addresses: ISignerAddress[]
  defaultSelectedNetworks?: number[]
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

function handleSubmit() {
  steps.value.currentStep += 1
  emit('destroy')
  openSignSignerModal(props.addresses, selectedNetworks.value, props.gnosisAddress)
}

function handleBack() {
  steps.value.currentStep -= 1
  emit('destroy')

  openReviewSignerModal({
    addresses: props.addresses,
    gnosisAddress: props.gnosisAddress,
    defaultSelectedNetworks: props.defaultSelectedNetworks,
  })
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-7.5 sm:p-7.5 p-5">
      <Steps class="mr-10" :total-steps="steps?.totalSteps" :current-step=" steps?.currentStep" />
      <div class="flex gap-[14px]">
        <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
          {{ steps.currentStep }}
        </div>
        <div class="flex gap-1">
          <h1>
            Select networks where new signers will be added
          </h1>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="sm:p-7.5 py-5 px-6">
      <template v-if="deployedNetworks?.length">
        <h2 class="text-sm mb-4">
          Deployed
        </h2>
        <ul class="mb-4 flex flex-col gap-4">
          <MultisigSelectNetworkItem v-for="option in deployedNetworks" :key="option.chainId" :addresses="addresses" :selected="isSelected(option.chainId)" :option="option" @on-select="toggleNetworkChainId(option.chainId)" />
        </ul>
      </template>
      <template v-if="nonDeployedNetworks?.length">
        <h2 class="text-sm mb-4 flex items-center gap-2.5">
          Not deployed <SvgoInfo2 v-tippy="'You can also deploy anytime in future on any chain at the same address'" class="text-slate-500" />
        </h2>
        <ul class="flex flex-col gap-4">
          <MultisigSelectNetworkItem v-for="option in nonDeployedNetworks" :key="option.chainId" :addresses="addresses" :selected="isSelected(option.chainId)" :option="option" @on-select="toggleNetworkChainId(option.chainId)" />
        </ul>
      </template>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="p-7.5 grid grid-cols-2 gap-4">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton :disabled="!selectedNetworks.length" type="submit" class="justify-center" size="lg">
        Proceed
      </CommonButton>
    </div>
  </form>
</template>
