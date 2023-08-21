<script setup lang="ts">
const props = defineProps<{
  position: Positions
}>()

const healthFactorFormatted = computed(() => {
  if (isNaN(toBN(props.position.healthFactor).toNumber()))
    return props.position.healthFactor
  const formatter = new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 })
  const value = formatter.format(toBN(props.position.healthFactor).toNumber())
  return value
})
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

    <div class="grid w-full grid-cols-2 gap-5">
      <div class="flex flex-col gap-1 px-5 py-4 dark:bg-gray-850 bg-slate-50 rounded-5">
        <p class="text-[26px] leading-[30px]">
          {{ formatPercent(toBN(position.apy).div(100).toFixed()) }}
        </p>
        <p class="text-xs text-slate-500">
          Net APY
        </p>
      </div>
      <div class="flex flex-col gap-1 px-5 py-4 dark:bg-gray-850 bg-slate-50 rounded-5">
        <p class="text-[26px] leading-[30px]">
          {{ healthFactorFormatted }}
        </p>
        <p class="text-xs text-slate-500">
          Health Factor
        </p>
      </div>
    </div>
    <div class="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
      <div class="flex flex-col gap-5">
        <h2 class="text-lg">
          Supplied: {{ formatUsd(position.positions?.totalSupplyInUsd) }}
        </h2>
        <ul class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-5 sm:max-h-[500px] max-h-[180px] sm:oveflow-[initial] overflow-auto scroll-style">
          <template v-if="toBN(position.positions?.totalSupplyInUsd).gt('0')">
            <DefiPositionRow v-for="item in position.suppliedTokens" :key="item.key" :chain-id="position.chainId" :item="item" />
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
        <ul class="flex flex-col dark:bg-gray-850 bg-slate-50 rounded-5 sm:max-h-[500px] max-h-[180px] overflow-auto scroll-style">
          <template v-if="toBN(position.positions?.totalBorrowInUsd).gt('0')">
            <DefiPositionRow v-for="item in position.borrowedTokens" :key="item.key" :chain-id="position.chainId" :item="item" :borrow="true" />
          </template>
          <p v-else class="py-4.5 px-5 text-center">
            No borrowed tokens
          </p>
        </ul>
      </div>
    </div>
  </div>
</template>
