<script setup lang="ts">
const props = defineProps<{
  tx: IAuthorityTx
  modelValue: ChainFees
  errors: ChainFeeErrors
}>()

const emit = defineEmits(['update:modelValue', 'update:errors'])

const transaction = computed(() => props.tx)

const { data, pending, error, rawData } = useEstimatedFee(
  transaction,
  ref(String(transaction.value.chainId)),
  {
    immediate: true,
  },
)

watch([rawData, data], () => {
  if (data.value && rawData.value) {
    Object.assign(props.modelValue, {
      [transaction.value.chainId]: data.value,
    })

    emit('update:modelValue', props.modelValue)
  }
})

watch(error, () => {
  if (error.value) {
    Object.assign(props.errors, {
      [transaction.value.chainId]: error.value,
    })
    emit('update:errors', props.errors)
  }
})
</script>

<template>
  <EstimatedFee wrapper-class="bg-transparent !p-0" hide-discount hide-error-info show-network-info :loading="pending" :data="data" :error="error" />
</template>
