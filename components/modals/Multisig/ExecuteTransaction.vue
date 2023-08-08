<script setup lang="ts">
import SVGQuestionCircle from '~/assets/images/icons/question-circle.svg?component'

const props = defineProps<{
  transaction: IMultisigTransaction
  isGasTopup?: boolean
}>()

const emit = defineEmits(['resolve', 'reject'])

const { data, pending, error } = useEstimatedFee(
  ref(props.transaction.data.params.actions),
  ref(String(props.transaction.chain_id)),
  {
    immediate: true,
    disabled: () => props.isGasTopup,
    nonce: props.transaction.nonce,
    metadata: props.transaction.data.params.metadata,
    options: {
      id: props.transaction.data.params.id || '0',
    },
  },
)

function handleResolve() {
  return emit('resolve', true)
}

function handleReject() {
  return emit('reject', false)
}
</script>

<template>
  <div
    class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
  >
    <SVGQuestionCircle class="w-10 h-10 text-primary" />

    <div class="flex flex-col gap-[15px]">
      <h1 class="text-lg font-semibold">
        Execute transaction
      </h1>
      <p

        class="text-slate-400 text-xs text-center leading-5 font-medium"
      >
        Are you sure you want to execute this transaction?
      </p>
    </div>
    <EstimatedFee
      class="w-full"
      :data="data"
      :loading="pending"
      :error="error"
    />
    <p v-if="!!error" class="text-orange text-sm flex items-center gap-2.5 w-full font-medium -my-2.5">
      Error Occured. Do you still wish to proceed? <SvgoInfo2 v-tippy="'We expect this transaction to fail. You can cancel this transaction by creating rejection proposal or execute this transaction. In most cases, both actions will have the same outcome'" />
    </p>
    <div
      class="flex w-full gap-4 items-center"
    >
      <CommonButton
        class="flex-1 justify-center"
        size="lg"
        color="white"
        @click="handleReject()"
      >
        Cancel
      </CommonButton>
      <CommonButton
        :loading="pending"
        :disabled="pending"
        class="flex-1 justify-center"
        size="lg"
        @click="handleResolve()"
      >
        Execute
      </CommonButton>
    </div>
  </div>
</template>
