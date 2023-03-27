<script lang="ts" setup>
defineProps<{
  details: ISimulation;
  chainId: string;
}>();
</script>

<template>
  <div class="flex gap-5 flex-col">
    <h1
      class="text-xs justify-center text-center text-orange-400 flex items-center"
    >
      Token Transfer & Approval Detected
    </h1>

    <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-[10px] gap-y-5">
      <li :key="k" v-for="(item, k) in details.balanceChange.approveTokens">
        <SimulationTokenCard
          type="approve"
          :chainId="chainId"
          :payload="item"
        />
      </li>
      <li :key="k" v-for="(item, k) in details.balanceChange.receiveTokens">
        <SimulationTokenCard
          type="recieve"
          :chainId="chainId"
          :payload="item"
        />
      </li>
      <li :key="k" v-for="(item, k) in details.balanceChange.sendTokens">
        <SimulationTokenCard type="send" :chainId="chainId" :payload="item" />
      </li>
    </ul>
  </div>
</template>
