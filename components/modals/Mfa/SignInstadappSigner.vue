<script lang="ts" setup>
const emit = defineEmits(['destroy'])
const signs = ref<boolean[]>([])

const steps = useState<SignerSteps>('signer-steps')

async function handleBack() {
  steps.value.currentStep -= 1
  emit('destroy')
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5">
      <div class="flex gap-[14px]">
        <div class="flex flex-col gap-1">
          <h1 class="text-lg leading-10">
            Sign on networks to proceed
          </h1>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="flex flex-col gap-7 p-7.5">
      <MfaSignAddSignerItem v-for="network in availableNetworks" :key="network.chainId" v-model="signs" :chain-id="network.chainId" />
    </ul>
    <div class="grid grid-cols-2 gap-4 p-7.5">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
    </div>
  </div>
</template>
