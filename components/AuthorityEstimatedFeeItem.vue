<script setup lang="ts">
const props = defineProps<{
  tx: IAuthorityTx
  modelValue: ChainFees
}>()

const emit = defineEmits(['update:modelValue'])

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
</script>

<template>
  <EstimatedFee wrapper-class="bg-transparent !p-0" hide-error-info show-network-info :loading="pending" :data="data" :error="error" />
</template>
