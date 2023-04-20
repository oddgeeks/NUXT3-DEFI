<script lang="ts" setup>
defineProps<{
  details: ISimulation
  chainId: string
  hasError: boolean
}>()
</script>

<template>
  <div class="flex gap-5 flex-col">
    <h1
      class="text-xs text-center sm:text-left"
      :class="[
        {
          'text-orange-400': hasError,
        },
      ]"
    >
      Transaction Breakdown
    </h1>

    <ul
      class="grid grid-cols-1 sm:grid-cols-2 -mr-3 gap-x-[10px] gap-y-5 scroll-style max-h-[239px] overflow-y-auto"
    >
      <template
        v-for="(item, k) in details.balanceChange.approveTokens"
        :key="k"
      >
        <SimulationTokenCard
          type="approve"
          :chain-id="chainId"
          :payload="item"
        />
      </template>
      <template
        v-for="(item, k) in details.balanceChange.receiveTokens"
        :key="k"
      >
        <SimulationTokenCard
          type="recieve"
          :chain-id="chainId"
          :payload="item"
        />
      </template>
      <template v-for="(item, k) in details.balanceChange.sendTokens" :key="k">
        <SimulationTokenCard type="send" :chain-id="chainId" :payload="item" />
      </template>
    </ul>
  </div>
</template>
