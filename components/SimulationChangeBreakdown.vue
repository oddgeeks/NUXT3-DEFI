<script setup lang="ts">
defineProps<{
  change: ISimulation['SimulationChange']
  chainId: string
  itemClass?: string
}>()
</script>

<template>
  <template
    v-for="(item, k) in change.approveTokens"
    :key="k"
  >
    <SimulationTokenCard
      type="approve"
      :chain-id="chainId"
      :payload="item"
      :class="itemClass"
    />
  </template>
  <template
    v-for="(item, k) in change.receiveTokens"
    :key="k"
  >
    <SimulationTokenCard
      type="recieve"
      :chain-id="chainId"
      :payload="item"
      :class="itemClass"
    />
  </template>
  <template v-for="(item, k) in change.sendTokens" :key="k">
    <SimulationTokenCard :class="itemClass" type="send" :chain-id="chainId" :payload="item" />
  </template>
</template>
