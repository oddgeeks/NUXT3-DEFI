<script lang="ts" setup>
import { major } from 'semver'

const props = defineProps<{
  addresses: ISignerAddress[]
}>()

const emit = defineEmits(['destroy', 'resolve'])

const { data: networkVersions } = useNuxtData('allNetworkVersions')

const selectedNetworks = ref<string[]>([])

const deployedNetworks = computed(() => networkVersions.value.filter((network: any) => gte(major(network.currentVersion), 3)))
const nonDeployedNetworks = computed(() => networkVersions.value.filter((network: any) => lt(major(network.currentVersion), 3)))

function toggleNetworkChainId(chainId: string) {
  if (selectedNetworks.value.includes(chainId))
    selectedNetworks.value = selectedNetworks.value.filter((id: string) => id !== chainId)
  else
    selectedNetworks.value = [...selectedNetworks.value, chainId]
}

function isSelected(chainId: string) {
  return selectedNetworks.value.includes(chainId)
}

function handleSubmit() {
  emit('resolve', true, selectedNetworks.value)
}

function handleBack() {
  emit('destroy')
  openReviewSignerModal(props.addresses)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="flex gap-[14px] p-7.5">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        3
      </div>
      <div class="flex gap-1">
        <h1>
          Select networks where new signers will be added
        </h1>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="p-7.5">
      <template v-if="deployedNetworks?.length">
        <h2 class="text-sm mb-4">
          Deployed
        </h2>
        <ul class="mb-4 flex flex-col gap-4">
          <MultisigSelectNetworkItem v-for="network in deployedNetworks" :key="network.chainId" :addresses="addresses" :selected="isSelected(network.chainId)" :network="network" @on-select="toggleNetworkChainId(network.chainId)" />
        </ul>
      </template>
      <template v-if="nonDeployedNetworks?.length">
        <h2 class="text-sm mb-4">
          Not deployed
        </h2>
        <ul class="flex flex-col gap-4 max-h-[210px] scroll-style overflow-auto">
          <MultisigSelectNetworkItem v-for="network in nonDeployedNetworks" :key="network.chainId" :addresses="addresses" :selected="isSelected(network.chainId)" :network="network" @on-select="toggleNetworkChainId(network.chainId)" />
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
