<script lang="ts" setup>
defineProps<{
  details: ISimulation;
  chainId: string;
  hasError: boolean;
}>();
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
        :key="k"
        v-for="(item, k) in details.balanceChange.approveTokens"
      >
        <SimulationTokenCard
          type="approve"
          :chainId="chainId"
          :payload="item"
        />
      </template>
      <template
        :key="k"
        v-for="(item, k) in details.balanceChange.receiveTokens"
      >
        <SimulationTokenCard
          type="recieve"
          :chainId="chainId"
          :payload="item"
        />
      </template>
      <template :key="k" v-for="(item, k) in details.balanceChange.sendTokens">
        <SimulationTokenCard type="send" :chainId="chainId" :payload="item" />
      </template>
    </ul>
  </div>
</template>
