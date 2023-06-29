<script lang="ts" setup>
const props = defineProps<{
  addresses: string[]
  defaultTreshold: number
}>()

const emit = defineEmits(['destroy'])

const { addSignersWithThreshold } = useAvocadoSafe()

function handleBack() {
  emit('destroy')
  openReviewSignerModal(props.addresses, props.defaultTreshold)
}

function handleSave() {
  emit('destroy')
}

async function handleSign(chainId: string | number) {
  const txHash = await addSignersWithThreshold(props.addresses, String(props.defaultTreshold), chainId)

  if (txHash)
    showPendingTransactionModal(txHash, chainId)
}
</script>

<template>
  <div>
    <div class="flex gap-[14px] p-7.5">
      <div class="w-10 h-10 shrink-0 rounded-full text-lg bg-primary items-center justify-center flex text-white">
        3
      </div>
      <div class="flex flex-col gap-1">
        <h1 class="text-lg leading-10">
          Sign on all the networks to proceed
        </h1>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="p-7.5 flex flex-col gap-7">
      <li v-for="network in availableNetworks" :key="network.chainId" class="w-full">
        <button class="flex items-center justify-between w-full">
          <span class="flex items-center gap-3 text-sm leading-5">
            <ChainLogo class="w-[26px] h-[26px]" :chain="network.chainId" />
            {{ network.name }}
          </span>
          <CommonButton @click="handleSign(network.chainId)">
            Sign
          </CommonButton>
        </button>
      </li>
    </ul>
    <div class="p-7.5 grid grid-cols-2 gap-4">
      <CommonButton class="justify-center" size="lg" color="white" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton class="justify-center" size="lg" @click="handleSave">
        Next
      </CommonButton>
    </div>
  </div>
</template>
