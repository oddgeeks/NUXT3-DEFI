<script setup lang="ts">
import { Tippy } from 'vue-tippy'

const props = defineProps<{
  txActions: any
  chainId: number | string
  metadata: string
}>()

const { transactionStack } = storeToRefs(useShared())
const { addToTransactionStack } = useShared()

const disabled = computed(() => {
  if (!transactionStack.value.length)
    return false

  const lastTx = transactionStack.value[transactionStack.value.length - 1]

  return lastTx.chainId !== props.chainId
})

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
  <Tippy :content="disabled ? 'The action should be on same chain' : undefined">
    <button :disabled="!txActions?.length || disabled" class="mx-auto flex w-fit items-center justify-center gap-2 text-xs text-primary disabled:text-gray-400" type="button" @click="handleAddBatch">
      <SvgoLayer class="h-4 w-4" />
      Add to Batch
    </button>
  </Tippy>
</template>
