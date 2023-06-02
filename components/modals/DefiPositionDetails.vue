<script setup lang="ts">
defineProps<{
  position: Positions
}>()
</script>

<template>
  <div class="flex flex-col gap-7.5 items-center justify-center">
    <div
      class="relative inline-block h-7.5 w-7.5 rounded-full flex-shrink-0"
    >
      <img
        class="h-7.5 w-7.5 rounded-full"
        :src="position.logoURI"
        :alt="position.label"
      >

      <ChainLogo
        :stroke="true"
        class="absolute w-4 h-4 -right-1 -bottom-1"
        :chain="position.chainId"
      />
    </div>
    <h1> {{ position.label }}</h1>

    <div class="grid grid-cols-2 gap-5 w-full">
      <div class="dark:bg-gray-850 bg-slate-50 rounded-5 flex flex-col gap-1 px-5 py-4">
        <p class="text-[26px] leading-[30px]">
          {{ formatPercent(toBN(position.apy).div(100).toFixed()) }}
        </p>
        <p class="text-xs text-slate-500">
          Net APY
        </p>
      </div>
      <div class="dark:bg-gray-850 bg-slate-50 rounded-5 flex flex-col gap-1 px-5 py-4">
        <p class="text-[26px] leading-[30px]">
          {{ position.healtFactor }}
        </p>
        <p class="text-xs text-slate-500">
          Health Factor
        </p>
      </div>
    </div>
    <div class="w-full grid grid-cols-2 gap-5">
      <div class="flex flex-col gap-5">
        <h2 class="text-lg">
          Supplied: {{ formatUsd(position.positions?.totalSupplyInUsd) }}
        </h2>
        <ul class="dark:bg-gray-850 bg-slate-50 rounded-5 flex flex-col">
          <template v-if="toBN(position.positions?.totalSupplyInUsd).gt('0')">
            <DefiPositionRow v-for="item in position.suppliedTokens" :key="item.key" :item="item" />
          </template>
          <p v-else class="py-4.5 px-5 text-center">
            No Supplied tokens
          </p>
        </ul>
      </div>
      <div class="flex flex-col gap-5">
        <h2 class="text-lg">
          Borrowed: {{ formatUsd(position.positions?.totalBorrowInUsd) }}
        </h2>
        <ul class="dark:bg-gray-850 bg-slate-50 rounded-5 flex flex-col">
          <template v-if="toBN(position.positions?.totalBorrowInUsd).gt('0')">
            <DefiPositionRow v-for="item in position.borrowedTokens" :key="item.key" :item="item" :borrow="true" />
          </template>
          <p v-else class="py-4.5 px-5 text-center">
            No borrowed tokens
          </p>
        </ul>
      </div>
    </div>
  </div>
</template>
