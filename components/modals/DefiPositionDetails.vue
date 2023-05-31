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
      <div class="dark:bg-gray-850 bg-slate-500 rounded-5 flex flex-col gap-1 px-5 py-4">
        <p class="text-[26px] leading-[30px]">
          9.7%
        </p>
        <p class="text-xs text-slate-500">
          Net APY
        </p>
      </div>
      <div class="dark:bg-gray-850 bg-slate-500 rounded-5 flex flex-col gap-1 px-5 py-4">
        <p class="text-[26px] leading-[30px]">
          1.24
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
        <div class="dark:bg-gray-850 bg-slate-500 rounded-5 flex flex-col gap-1 px-5 py-4">
          2521 DAI
        </div>
      </div>
      <div class="flex flex-col gap-5">
        <h2 class="text-lg">
          Borrowed: {{ formatUsd(position.positions?.totalBorrowInUsd) }}
        </h2>
        <div class="dark:bg-gray-850 bg-slate-500 rounded-5 flex flex-col gap-1 px-5 py-4">
          2521 DAI
        </div>
      </div>
    </div>
  </div>
</template>
