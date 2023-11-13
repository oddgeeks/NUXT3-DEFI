<script setup lang="ts">
import flatMap from 'lodash/flatMap'
import groupBy from 'lodash/groupBy'

const { transactionStack } = storeToRefs(useShared())
const { tokens } = storeToRefs(useTokens())
const { sendTransactions } = useAvocadoSafe()

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
  await Promise.all(multipleActions.value.map(action => sendTransactions(
    action.actions,
    action.chainId,
    action.options,
    'transfer').then(hash => addTransactionToQueue({
    hash,
    chainId: action.chainId,
    preventAutoClose: true,
  }))))
}
</script>

<template>
  <div class="p-7.5">
    <ul class="flex flex-col gap-2.5">
      <li v-for="tx in multipleActions" :key="tx.chainId" class="flex flex-col rounded-2xl p-3 text-sm dark:bg-slate-850">
        <div class="mb-3 flex items-center gap-2">
          <ChainLogo class="h-5 w-5" :chain="tx.chainId" />
          {{ chainIdToName(tx.chainId) }}
        </div>
        <div v-for="(metadata, index) in decodeMetadata(tx.options?.metadata)" :key="index" class="flex items-center gap-2.5">
          <span class="capitalize">
            {{ metadata.type }}
          </span>
          <ActionMetadata :key="metadata" :tokens="transformedTokens" compact :chain_id="tx.chainId" :metadata="metadata" />
        </div>
      </li>
    </ul>

    <hr class="my-5 border-slate-150 dark:border-slate-800">

    <div v-if="estimatePending" class="mx-auto flex items-center justify-center">
      <SvgSpinner />
    </div>

    <div v-if="estimatedData?.length && totalAmountAfterDiscount">
      <MultipleEstimatedFee v-if="totalAmountAfterDiscount" :error="estimateError" :total-amount-after-discount="totalAmountAfterDiscount?.toFixed()" :data="estimatedData" />
    </div>
    <CommonButton class="mt-7.5 w-full justify-center" @click="onSubmit">
      Submit
    </CommonButton>
  </div>
</template>
