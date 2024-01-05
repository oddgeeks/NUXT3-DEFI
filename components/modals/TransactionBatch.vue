<script setup lang="ts">
import flatMap from 'lodash/flatMap'
import groupBy from 'lodash/groupBy'

const emit = defineEmits(['destroy'])

const { transactionStack } = storeToRefs(useShared())
const { removeActionsByChainId, removeActionsByMetadata } = useShared()
const { tokens } = storeToRefs(useTokens())
const { sendTransactions } = useAvocadoSafe()
const { switchToAvocadoNetwork } = useNetworks()
const { parseTransactionError } = useErrorHandler()

const loading = ref(false)

const transformedTokens = computed(() => {
  if (!tokens.value)
    return []

  return tokens.value.map((i) => {
    return {
      ...i,
      chain_id: i.chainId,
      logo_url: i.logoURI,
    }
  })
})

const groupedTransactions = computed(() => groupBy(transactionStack.value, 'chainId'))

const multipleActions = computed<IEstimatedActions[]>(() => {
  const arr: IEstimatedActions[] = []

  const groupedTransactions = groupBy(transactionStack.value, 'chainId')

  for (const chainId in groupedTransactions) {
    const actions = flatMap(groupedTransactions[chainId], 'actions')
    const metadata = flatMap(groupedTransactions[chainId], 'options.metadata')

    const encodedMetadata = encodeMultipleActions(...metadata)

    arr.push({
      chainId: Number(chainId),
      actions,
      options: {
        metadata: encodedMetadata,
      },
    })
  }

  return arr
})

const { data: estimatedData, totalAmountAfterDiscount, pending: estimatePending, error: estimateError } = useMultipleEstimatedFee(multipleActions)

async function onSubmit() {
  try {
    loading.value = true

    await switchToAvocadoNetwork()

    for await (const action of multipleActions.value) {
      try {
        const hash = await sendTransactions(
          action.actions,
          action.chainId,
          action.options,
          'transfer',
        )

        if (hash) {
          addTransactionToQueue({
            hash,
            chainId: action.chainId,
          })
        }
      }
      catch (e: any) {
        const err = parseTransactionError(e)

        openSnackbar({
          message: err.formatted,
          type: 'error',
        })
        continue
      }
    }

    transactionStack.value = []
    emit('destroy')
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

watch(multipleActions, () => {
  if (multipleActions.value.length === 0)
    emit('destroy')
})
</script>

<template>
  <div>
    <ModalTitle class="border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <template #icon>
        <SvgoLayer />
      </template>
      <template #title>
        Transaction Batch
      </template>
      <template #subtitle>
        Please avoid conflicting transactions in the batch to avoid transaction failure
      </template>
    </ModalTitle>
    <div class="px-7.5 pt-5">
      <ul class="flex flex-col gap-2.5">
        <li v-for="tx in multipleActions" :key="tx.chainId" class="flex flex-col gap-5 rounded-2xl border border-gray-800 bg-gray-850 p-3 px-4 py-[14px] text-sm">
          <div class="flex items-center gap-2.5">
            <ChainLogo class="h-[26px] w-[26px]" :chain="tx.chainId" />
            {{ chainIdToName(tx.chainId) }}

            <button class="ml-auto" type="button" @click="removeActionsByChainId(tx.chainId)">
              <SvgoTrash2 class="text-red-alert" />
            </button>
          </div>
          <div class="flex flex-col gap-2.5">
            <div v-for="(metadata, index) in decodeMetadata(tx.options?.metadata)" :key="index" class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <span class="capitalize text-gray-400">
                {{ metadata.type }}
              </span>
              <ActionMetadata :key="metadata" :tokens="transformedTokens" compact :chain_id="tx.chainId" :metadata="metadata" />

              <button class="ml-auto" type="button" @click="removeActionsByMetadata(groupedTransactions[tx.chainId][index].options?.metadata)">
                <SvgoX />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <hr class="my-5 border-slate-800">

    <div class="flex flex-col gap-5 px-7.5 pb-7.5">
      <MultipleEstimatedFee :error="estimateError" :total-amount-after-discount="totalAmountAfterDiscount ? totalAmountAfterDiscount?.toFixed() : '0'" :data="estimatedData" />
      <CommonButton :disabled="!!estimateError" :loading="estimatePending || loading" size="lg" class="w-full justify-center" @click="onSubmit">
        Submit
      </CommonButton>
    </div>
  </div>
</template>
