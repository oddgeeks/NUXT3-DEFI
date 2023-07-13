<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const props = defineProps<{
  chainId: number | string
  additionalCount: number
}>()

defineEmits(['resolve'])

const { requiredSigners } = storeToRefs(useMultisig())

const requiredSignersByChain = computed(() => requiredSigners.value.find(i => i.chainId == props.chainId))

const defaultThreshold = computed(() => requiredSignersByChain.value?.requiredSignerCount || 1)

const threshold = ref(defaultThreshold.value)

const minCount = 1
const maxCount = computed(() => (requiredSignersByChain.value?.signerCount || 1) + props.additionalCount)

const availableThresholds = computed(() => generateNumber(minCount, maxCount.value))

const isRemove = computed(() => toBN(props.additionalCount).lt(0))
const isAdd = computed(() => toBN(props.additionalCount).gt(0))

onMounted(() => {
  const isValueNotExist = !availableThresholds.value.some(i => i == threshold.value)

  if (isValueNotExist)
    threshold.value = availableThresholds.value[0]
})
</script>

<template>
  <div class="p-7.5">
    <h2 class="mb-2">
      Threshold
    </h2>
    <h3 class="text-sm text-slate-400 mb-5">
      <span v-if="isRemove">After deleting signer(s), any transaction confirmation of</span>
      <span v-else-if="isAdd">After adding signer(s), any transaction confirmation of</span>
      <span v-else>
        Any transaction requires the confirmation of
      </span>
    </h3>

    <div class="flex text-sm items-center gap-5">
      <CommonSelect v-model="threshold" class="w-[80px]" :options="generateNumber(minCount, maxCount)" />
      Out of {{ maxCount }} signer(s)
    </div>
    <CommonButton class="w-full justify-center mt-5" size="lg" @click="$emit('resolve', true, defaultThreshold === threshold ? undefined : threshold)">
      Continue
    </CommonButton>
  </div>
</template>
