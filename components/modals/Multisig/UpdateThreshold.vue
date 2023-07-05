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
const maxCount = computed(() => Math.max(2, requiredSignersByChain.value?.signerCount || 1 + props.additionalCount))
</script>

<template>
  <div class="p-7.5">
    <h2>Treshold</h2>
    <h3 class="text-sm text-slate-400 mb-5">
      Any transaction requires the confirmation of
    </h3>

    <div class="flex text-sm items-center gap-5">
      <CommonSelect v-model="threshold" class="w-[80px]" :options="generateNumber(minCount, maxCount)" />
      Out of {{ requiredSignersByChain?.signerCount }} signer(s)
    </div>
    <CommonButton class="w-full justify-center mt-5" size="lg" @click="$emit('resolve', true, defaultThreshold === threshold ? undefined : threshold)">
      Continue
    </CommonButton>
  </div>
</template>
