<script setup lang="ts">
const props = defineProps<{
  txActions: any
  chainId: number | string
  metadata: string
}>()

const { addToTransactionStack } = useShared()

const { lastModal } = useModal()

function handleAddBatch() {
  addToTransactionStack({
    actions: props.txActions,
    chainId: props.chainId,
    options: {
      metadata: props.metadata,
    },
  })

  notify({
    title: 'Transaction Batch',
    message: 'Transaction actions added to the stack',
    type: 'success',
    icon: 'SvgoLayer',
    as: 'button',
    onClick() {
      openTransactionBatchModal()
    },
  })

  if (lastModal.value)
    lastModal.value.destroy()
}
</script>

<template>
  <button :disabled="!txActions?.length" class="mx-auto flex w-fit items-center justify-center gap-2 text-xs text-primary disabled:text-gray-400" type="button" @click="handleAddBatch">
    <SvgoLayer class="h-4 w-4" />
    Add to Batch
  </button>
</template>
