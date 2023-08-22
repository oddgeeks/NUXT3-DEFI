<script setup lang="ts">
const props = defineProps<{
  healthFactor: string | number
}>()

const { calculateHealthFactor } = useDefi()

const status = calculateHealthFactor(props.healthFactor)
</script>

<template>
  <span class="flex items-center gap-2.5">
    {{ formatHealthFactor(healthFactor) }}

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
