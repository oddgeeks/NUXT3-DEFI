<script setup lang="ts">
const props = defineProps<{
  healtFactor: string | number
}>()

const { calculateHealthFactor } = useDefi()

const status = calculateHealthFactor(props.healtFactor)
</script>

<template>
  <span class="flex items-center gap-2.5">
    {{ healtFactor }}

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
