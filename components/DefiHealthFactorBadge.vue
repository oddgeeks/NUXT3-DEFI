<script setup lang="ts">
const props = defineProps<{
  healthFactor: string | number
}>()

const { calculateHealthFactor } = useDefi()

const status = calculateHealthFactor(props.healthFactor)
const healthFactorFormatted = computed(() => {
  if (isNaN(toBN(props.healthFactor).toNumber()))
    return props.healthFactor
  const formatter = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 })
  const value = formatter.format(toBN(props.healthFactor).toNumber())
  return value
})
</script>

<template>
  <span class="flex items-center gap-2.5">
    {{ healthFactorFormatted }}

    <CommonBadge
      :color="
        status?.isRisky
          ? 'red'
          : status?.isModerate
            ? 'yellow'
            : 'green'
      "
    >
      {{ status.label }}
    </CommonBadge>
  </span>
</template>
