<script setup lang="ts">
const props = defineProps<{
  healthFactor: string | number
}>()

const { calculateHealthFactor } = useDefi()

const status = calculateHealthFactor(props.healthFactor)
const healthFactorFormatted = computed(() => {
  if (props.healthFactor === '∞')
    return '∞'

  const formatter = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 })
  return formatter.format(toBN(props.healthFactor).toNumber())
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
