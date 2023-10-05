<script lang="ts" setup>
const props = defineProps<{
  details: ISimulation
  chainId: string
  hasError: boolean
  wrapperClass?: string
  itemClass?: string
  titleHidden?: boolean
}>()

const noBreakdownAvailable = computed(() => {
  const details = props.details

  return details.simulation.approveTokens?.length === 0
    && details.simulation.receiveTokens?.length === 0
    && details.simulation.sendTokens?.length === 0
    && details.simulation.revokeTokens?.length === 0
})
</script>

<template>
  <div class="flex flex-col gap-5">
    <h1
      v-if="!titleHidden"
      class="text-center text-xs sm:text-left"
      :class="[
        {
          'text-orange-400': hasError,
        },
      ]"
    >
      Transaction Breakdown
    </h1>

    <p v-if="noBreakdownAvailable" class="text-xs font-medium text-slate-400">
      No breakdown available
    </p>

    <ul
      v-else
      :class="wrapperClass"
      class="scroll-style -mr-3 grid max-h-[239px] grid-cols-1 gap-x-[10px] gap-y-5 overflow-y-auto sm:grid-cols-2"
    >
      <template
        v-for="(item, k) in details.simulation.approveTokens"
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
        v-for="(item, k) in details.simulation.receiveTokens"
        :key="k"
      >
        <SimulationTokenCard
          type="recieve"
          :chain-id="chainId"
          :payload="item"
          :class="itemClass"
        />
      </template>
      <template v-for="(item, k) in details.simulation.sendTokens" :key="k">
        <SimulationTokenCard :class="itemClass" type="send" :chain-id="chainId" :payload="item" />
      </template>
    </ul>
  </div>
</template>
