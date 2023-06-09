<script setup lang="ts">
defineEmits(['destroy'])
const { isCrossChain } = useSend()
</script>

<template>
  <ModalsSendStepCross v-if="isCrossChain" />
  <ModalsSendStepNormal v-else />
</template>
