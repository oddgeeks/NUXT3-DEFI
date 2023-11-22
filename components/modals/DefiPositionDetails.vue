<script setup lang="ts">
defineProps<{
  position: Positions
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-7.5">
    <div
      class="relative inline-block h-7.5 w-7.5 shrink-0 rounded-full"
    >
      <img
        class="h-7.5 w-7.5 rounded-full"
        :src="position.logoURI"
        :alt="position.label"
      >

      <ChainLogo
        :stroke="true"
        class="absolute -bottom-1 -right-1 h-4 w-4"
        :chain="position.chainId"
      />
    </div>
    <h1> {{ position.label }}</h1>

    <div class="grid w-full grid-cols-2 gap-5">
      <div class="flex flex-col gap-1 rounded-5 bg-gray-850 px-5 py-4">
        <p class="text-[26px] leading-[30px]">
          {{ formatPercent(toBN(position.apy).div(100).toFixed()) }}
        </p>
        <p class="text-xs text-gray-500">
          Net APY
        </p>
      </div>
      <div class="flex flex-col gap-1 rounded-5 bg-gray-850 px-5 py-4">
        <p class="text-[26px] leading-[30px]">
          {{ abbreviateNumber(position.healthFactor) }}
        </p>
        <p class="text-xs text-gray-500">
          Health Factor
        </p>
      </div>
    </div>
    <div class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
      <div class="flex flex-col gap-5">
        <h2 class="text-lg">
          Supplied: {{ formatUsd(position.positions?.totalSupplyInUsd) }}
        </h2>
        <ul class="sm:oveflow-[initial] scroll-style flex max-h-[180px] flex-col overflow-auto rounded-5 bg-gray-850 sm:max-h-[500px]">
          <template v-if="toBN(position.positions?.totalSupplyInUsd).gt('0')">
            <DefiPositionRow v-for="item in position.suppliedTokens" :key="item.key" :chain-id="position.chainId" :item="item" />
          </template>
          <p v-else class="px-5 py-4.5 text-center">
            No Supplied tokens
          </p>
        </ul>
      </div>
      <div class="flex flex-col gap-5">
        <h2 class="text-lg">
          Borrowed: {{ formatUsd(position.positions?.totalBorrowInUsd) }}
        </h2>
        <ul class="scroll-style flex max-h-[180px] flex-col overflow-auto rounded-5 bg-gray-850 sm:max-h-[500px]">
          <template v-if="toBN(position.positions?.totalBorrowInUsd).gt('0')">
            <DefiPositionRow v-for="item in position.borrowedTokens" :key="item.key" :chain-id="position.chainId" :item="item" :borrow="true" />
          </template>
          <p v-else class="px-5 py-4.5 text-center">
            No borrowed tokens
          </p>
        </ul>
      </div>
    </div>
  </div>
</template>
