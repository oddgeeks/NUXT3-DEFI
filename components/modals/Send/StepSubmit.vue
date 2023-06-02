<script setup lang="ts">
const { isCrossChain } = useSend()
</script>

<template>
  <ModalsSendStepCross v-if="isCrossChain" />
  <ModalsSendStepNormal v-else />
</template>
