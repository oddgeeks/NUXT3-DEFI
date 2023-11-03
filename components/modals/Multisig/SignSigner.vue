<script lang="ts" setup>
const props = defineProps<{
  addresses: ISignerAddress[]
  chainIds: number[]
  gnosisAddress?: string
  defaultThreshold?: number
}>()

const emit = defineEmits(['destroy'])
const signs = ref<boolean[]>([])

const steps = useState<SignerSteps>('signer-steps')

const allSigned = computed(() => props.chainIds.length === signs.value.length)

async function handleBack() {
  steps.value.currentStep -= 1
  emit('destroy')

  openMultisigSelectNetworkModal({
    addresses: props.addresses,
    defaultSelectedNetworks: props.chainIds,
    gnosisAddress: props.gnosisAddress,
    defaultThreshold: props.defaultThreshold,
  })
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5">
      <Steps class="mr-10" :total-steps="steps.totalSteps" :current-step="steps.currentStep" />
      <div class="flex gap-[14px]">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg text-white">
          {{ steps.currentStep }}
        </div>
        <div class="flex flex-col gap-1">
          <h1 class="text-lg leading-10">
            Sign on networks to proceed
          </h1>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-gray-800">
    <ul class="flex flex-col gap-7 p-7.5">
      <MultisigSignAddSignerItem v-for="chainId in chainIds" :key="chainId" v-model="signs" :gnosis-address="gnosisAddress" :default-threshold="defaultThreshold" :chain-id="chainId" :addresses="addresses" />
    </ul>
    <div class="grid grid-cols-2 gap-4 p-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton v-if="allSigned" class="justify-center" size="lg" @click="$emit('destroy')">
        Close
      </CommonButton>
    </div>
  </div>
</template>
