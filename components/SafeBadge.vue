<script setup lang="ts">
const props = defineProps<{
  safe: ISafe
  showTooltip?: boolean
}>()

const { checkSafeIsActualMultisig } = useMultisig()

const isMultisig = computed(() => checkSafeIsActualMultisig(props.safe))
const isLegacy = computed(() => props.safe.multisig === 0)
const legacyTooltip = 'Please migrate your funds to new Avocado Personal to enjoy exciting updates in the future. Your legacy wallet will stay functional & secure forever.'
</script>

<template>
  <p
    v-bind="$attrs"
    :class="isMultisig ? 'bg-purple text-purple' : isLegacy ? 'bg-gray-400 text-gray-400' : 'bg-primary text-primary'"
    class="rounded-lg bg-opacity-[14%] px-2 py-0.5 text-xs font-medium"
  >
    {{ isMultisig ? 'MULTISIG' : isLegacy ? 'LEGACY' : 'PERSONAL' }}
  </p>
  <SvgoInfo2 v-if="showTooltip && isLegacy" v-tippy="legacyTooltip" class="shrink-0 text-gray-500" />
</template>
