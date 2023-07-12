<script lang="ts" setup>
import { getAddress } from 'ethers/lib/utils'

const props = defineProps<{
  addresses: string[]
  chainId: string | number
}>()

defineEmits(['destroy'])

const pending = ref(false)
const signed = ref(false)

const { addSignersWithThreshold } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())

async function handleSign() {
  try {
    pending.value = true

    const existingSigners = selectedSafe.value?.signers[props.chainId] || []

    const actualSigners = props.addresses.filter((address: string) => !existingSigners.some(addr => getAddress(address) === getAddress(addr)))

    if (!actualSigners.length) {
      console.log('No new signers')
      return
    }

    const { payload, success } = await openUpdateThresholdModal(props.chainId, actualSigners.length)

    if (!success)
      return

    const txHash = await addSignersWithThreshold(actualSigners, payload, props.chainId)

    if (txHash)
      showPendingTransactionModal(txHash, props.chainId)

    signed.value = true
  }
  catch (e) {
    console.error(e)
    openSnackbar({
      message: 'Something went wrong',
      type: 'error',
    })
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <li class="flex items-center justify-between w-full">
    <span class="flex items-center gap-3 text-sm leading-5">
      <ChainLogo class="w-[26px] h-[26px]" :chain="chainId" />
      {{ chainIdToName(chainId) }}
    </span>
    <CommonButton :disabled="pending || signed" :loading="pending" @click="handleSign">
      {{ signed ? 'Signed' : 'Sign' }}
    </CommonButton>
  </li>
</template>
