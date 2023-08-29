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

  return details.balanceChange.approveTokens?.length === 0
    && details.balanceChange.receiveTokens?.length === 0
    && details.balanceChange.sendTokens?.length === 0
})
</script>

<template>
  <div class="flex gap-5 flex-col">
    <h1
      v-if="!titleHidden"
      class="text-xs text-center sm:text-left"
      :class="[
        {
          'text-orange-400': hasError,
        },
      ]"
    >
      Transaction Breakdown
    </h1>

    <p v-if="noBreakdownAvailable" class="text-slate-400 font-medium text-xs">
      No breakdown available
    </p>

    <ul
      v-else
      :class="wrapperClass"
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
          :class="itemClass"
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
          :class="itemClass"
        />
      </template>
      <template v-for="(item, k) in details.balanceChange.sendTokens" :key="k">
        <SimulationTokenCard :class="itemClass" type="send" :chain-id="chainId" :payload="item" />
      </template>
    </ul>
  </div>
</template>
