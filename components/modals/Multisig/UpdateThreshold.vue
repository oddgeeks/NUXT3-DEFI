<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const props = defineProps<{
  chainId: number | string
  additionalCount: number
  activeStep?: number
  totalSteps?: number
  thresholdDefault?: number
}>()

defineEmits(['resolve'])

const { safeOptions, selectedSafe } = storeToRefs(useSafe())

const requiredSignersByChain = computed(() => safeOptions.value.find(i => i.chainId == props.chainId))

const defaultThreshold = computed(() => props.thresholdDefault || requiredSignersByChain.value?.threshold || 1)

const threshold = ref(defaultThreshold.value)

const minCount = 1
const maxCount = computed(() => {
  const signers = selectedSafe.value?.signers || {}
  const chainSignerCount = signers[props.chainId] || []

  return (chainSignerCount.length || 1) + props.additionalCount
})

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
  <div>
    <div class="sm:p-7.5 p-5 flex flex-col gap-7.5">
      <Steps v-if="activeStep && totalSteps" class="mr-10" :current-step="activeStep" :total-steps="totalSteps" />
      <div>
        <h2 class="text-lg">
          Update Treshold
        </h2>
        <h3 class="text-sm text-slate-400">
          <span v-if="isRemove">After deleting signer(s), any transaction requires confirmation of</span>
          <span v-else-if="isAdd">After adding signer(s), any transaction requires confirmation of</span>
          <span v-else>
            Any transaction requires the confirmation of
          </span>
        </h3>
      </div>
    </div>

    <hr class="border-slate-150 dark:border-slate-800">
    <div class="flex text-sm items-center gap-5 sm:p-7.5 p-6">
      <CommonSelect v-model="threshold" class="w-[80px]" :options="generateNumber(minCount, maxCount)" />
      Out of {{ maxCount }} signer(s)
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="sm:p-7.5 p-6">
      <CommonButton class="w-full justify-center" size="lg" @click="$emit('resolve', true, defaultThreshold === threshold ? undefined : threshold)">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
