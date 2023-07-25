<script lang="ts" setup>
import { getAddress } from 'ethers/lib/utils'

const props = defineProps<{
  addresses: ISignerAddress[]
  chainId: string | number
  modelValue: boolean[]
}>()

const emit = defineEmits(['destroy', 'update:modelValue'])

const pending = ref(false)
const signed = ref(false)

const { addSignersWithThreshold } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())
const { addContact, safeContacts } = useContacts()

async function handleSign() {
  try {
    pending.value = true

    const existingSigners = selectedSafe.value?.signers[props.chainId] || []

    const actualSigners = props.addresses.filter(address => !existingSigners.some(addr => getAddress(address.address) === getAddress(addr)))

    if (!actualSigners.length) {
      console.log('No new signers')
      return
    }

    const { payload, success } = await openUpdateThresholdModal(props.chainId, actualSigners.length)

    if (!success)
      return

    const txHash = await addSignersWithThreshold(actualSigners, payload, props.chainId)

    for (const signer of actualSigners) {
      const contact = safeContacts.value.find(contact => getAddress(contact.address) === getAddress(signer.address))

      if (!contact) {
        addContact({
          address: signer.address,
          name: signer.name,
          chainId: '', // all chains
        })
      }
    }

    if (txHash)
      showPendingTransactionModal(txHash, props.chainId)

    signed.value = true

    const modelValue = props.modelValue
    modelValue.push(true)
    emit('update:modelValue', modelValue)
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
