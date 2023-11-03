<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
}>()

const { checkSafeIsActualMultisig } = useMultisig()

const isMultisig = computed(() => checkSafeIsActualMultisig(props.safe))
const isLegacy = computed(() => props.safe.multisig === 0)
</script>

<template>
  <p
    :class="isMultisig ? 'bg-purple text-purple' : isLegacy ? 'bg-gray-400 text-gray-400' : 'bg-primary text-primary'"
    class="rounded-lg bg-opacity-[14%] px-2 py-0.5 text-xs font-medium"
  >
    {{ isMultisig ? 'MULTISIG' : isLegacy ? 'LEGACY' : 'PERSONAL' }}
  </p>
</template>
