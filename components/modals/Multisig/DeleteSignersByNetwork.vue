<script setup lang="ts">
const props = defineProps<{
  addresses: string[]
}>()

const { selectedSafe } = storeToRefs(useSafe())
const { removeSignerWithThreshold } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()

type StateRecord = Record<string | number, boolean>

const pending = ref<StateRecord>({})
const executed = ref<StateRecord>({})
const signed = ref<StateRecord>({})

function formatSigners() {
  return Object.fromEntries(
    Object.entries(selectedSafe.value?.signers || {})
      .map(([key, value]) =>
        [key, value.filter(address =>
          props.addresses.includes(address))]),
  )
}

const chainSigners = ref(formatSigners())

function removeSigner(signers: string[], signer: string) {
  signers.splice(signers.indexOf(signer), 1)
}

async function handleRemove(chainId: string | number) {
  try {
    pending.value[chainId] = true
    const addresses = chainSigners.value[chainId]

    const { payload: threshold, success: thresholdSuccess } = await openUpdateThresholdModal(chainId, addresses.length * -1, {
      activeStep: 1,
      totalSteps: 2,
    })

    if (!thresholdSuccess)
      return

    const metadata = encodeRemoveSignersMetadata(addresses)

    const txHash = await removeSignerWithThreshold({
      addresses,
      chainId,
      threshold,
    })

    signed.value[chainId] = true

    if (txHash) {
      executed.value[chainId] = true
      logActionToSlack({
        action: 'remove-signers',
        account: account.value,
        txHash,
        message: generateSlackMessage(metadata, chainId),
        chainId: String(chainId),
      })

      showPendingTransactionModal({
        hash: txHash,
        chainId,
      })
    }
  }
  catch (error: any) {
    const parsed = parseTransactionError(error)
    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
  }
  finally {
    pending.value[chainId] = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-5 border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <Steps :total-steps="2" :current-step="2" />
      <ModalTitle class="items-center">
        <template #icon>
          2
        </template>
        <template #title>
          Select networks where signers will be removed
        </template>
      </ModalTitle>
    </div>

    <div class="px-7.5 py-5 sm:px-7.5 sm:pb-7.5">
      <ul class="flex flex-col gap-[14px]">
        <template v-for="signers, chainId in chainSigners" :key="chainId">
          <li v-if="signers.length">
            <div class="mb-[14px] flex items-center justify-between">
              <div class="flex items-center gap-3 text-sm">
                <ChainLogo class="h-7.5 w-7.5" :chain="chainId" />
                {{ chainIdToName(chainId) }}
              </div>
              <CommonButton size="sm" color="red" class="justify-center" :disabled="pending[chainId] || signed[chainId] || executed[chainId]" :loading="pending[chainId]" @click="handleRemove(chainId)">
                {{ executed[chainId] ? 'Executed' : signed[chainId] ? 'Signed' : 'Remove' }}
              </CommonButton>
            </div>
            <ul class="flex flex-col rounded-2xl bg-gray-850">
              <li v-for="signer in signers" :key="signer" class="flex items-center justify-between border-b border-gray-875 px-4 py-[14px] last:border-b-0 last:pb-[14px]">
                <div class="flex items-center gap-3 text-xs">
                  <AuthorityAvatar :address="signer" />
                  {{ signer }}
                </div>
                <button v-tippy="'Exclude this signer from this network'" @click="removeSigner(signers, signer)">
                  <SvgoX class="h-3 w-3" />
                </button>
              </li>
            </ul>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
