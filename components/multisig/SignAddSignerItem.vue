<script lang="ts" setup>
import { getAddress } from 'ethers/lib/utils'

const props = defineProps<{
  addresses: ISignerAddress[]
  chainId: string | number
  modelValue: boolean[]
  defaultThreshold?: number
  gnosisAddress?: string
}>()

const emit = defineEmits(['destroy', 'update:modelValue'])

const pending = ref(false)
const signed = useState(`signed-${props.chainId}`, () => false)
const executed = useState(`executed-${props.chainId}`, () => false)

const { addSignersWithThreshold } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())
const { addContact, safeContacts, editContact } = useContacts()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()

async function handleSign() {
  try {
    pending.value = true

    const selectedSafeSigners = selectedSafe.value?.signers || {}
    const existingSigners = selectedSafeSigners[props.chainId] || []

    const actualSigners = props.addresses.filter(address => !existingSigners.some(addr => getAddress(address.address) === getAddress(addr)))

    if (!actualSigners.length) {
      console.log('No new signers')
      return
    }

    const { payload: threshold, success } = await openUpdateThresholdModal(props.chainId, actualSigners.length, {
      defaultThreshold: props.defaultThreshold as any,
    })

    if (!success)
      return

    const signers = actualSigners.map(signer => signer.address)

    const metadata = threshold
      ? encodeMultipleActions(
        encodeAddSignersMetadata(signers, false),
        encodeChangeThresholdMetadata(threshold, false),
      )
      : encodeAddSignersMetadata(signers)

    const txHash = await addSignersWithThreshold({
      addresses: actualSigners,
      threshold,
      chainId: props.chainId,
    })

    for (const signer of actualSigners) {
      const contact = safeContacts.value.find(contact => getAddress(contact.address) === getAddress(signer.address))

      const newContact = {
        address: signer.address,
        name: signer.name,
        chainId: '', // all chains
      }

      if (!contact)
        addContact(newContact)

      else if (contact && signer.name)
        editContact(contact, newContact)
    }

    if (txHash) {
      executed.value = true

      const additionalMessage = props.gnosisAddress ? `${'`Gnosis Import`'} ${props.gnosisAddress}` : ''

      logActionToSlack({
        account: account.value,
        action: 'add-signers',
        txHash,
        message: generateSlackMessage(metadata, props.chainId, additionalMessage),
        chainId: String(props.chainId),
      })

      showPendingTransactionModal(txHash, props.chainId)
    }

    signed.value = true

    const modelValue = props.modelValue
    modelValue.push(true)
    emit('update:modelValue', modelValue)
  }
  catch (e: any) {
    const parsed = parseTransactionError(e)

    openSnackbar({
      message: parsed.formatted,
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
    <CommonButton :disabled="pending || signed || executed" :loading="pending" @click="handleSign">
      {{ executed ? 'Executed' : signed ? 'Signed' : 'Sign' }}
    </CommonButton>
  </li>
</template>
