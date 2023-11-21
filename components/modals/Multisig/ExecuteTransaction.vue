<script setup lang="ts">
import SVGQuestionCircle from '~/assets/images/icons/question-circle.svg?component'

const props = defineProps<{
  transaction: IMultisigTransaction
  isGasTopup?: boolean
}>()

const emit = defineEmits(['resolve', 'reject', 'destroy'])

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
</script>

<template>
  <div
    class="inline-flex w-full flex-col items-center justify-center gap-7.5 text-center"
  >
    <SVGQuestionCircle class="h-10 w-10 text-primary" />

    <div class="flex flex-col gap-[15px]">
      <h1 class="text-lg font-semibold">
        Execute transaction
      </h1>
      <p

        class="text-center text-xs font-medium leading-5 text-gray-400"
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
    <div v-if="!!error" class="flex w-full flex-col gap-7.5">
      <p class="-my-2.5 w-full text-left text-xs font-medium">
        This transaction will most likely fail on-chain.<br>
        Please cancel this by creating a rejection transaction.
      </p>
      <CommonButton
        size="lg" color="red" class="w-full justify-center" @click="$emit('resolve', false, {
          rejection: true,
        })"
      >
        Create rejection transaction
      </CommonButton>
    </div>
    <div
      v-else
      class="flex w-full items-center gap-4"
    >
      <CommonButton
        class="flex-1 justify-center"
        size="lg"
        color="white"
        @click="$emit('reject', false)"
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
