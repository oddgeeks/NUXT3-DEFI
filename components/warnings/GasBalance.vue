<template>
  <div
    class="mb-4 flex w-full flex-col justify-center gap-[15px] rounded-5 bg-primary/10 p-4 text-center text-sm text-primary sm:flex-row"
  >
    <div class="inline-flex items-center gap-2">
      <span class="text-base">⛽</span>
      <span class="self-center text-xs">
        Get started with Avocado by topping up gas using USDC
      </span>
    </div>
    <CommonButton class="flex h-7.5 justify-center !px-4 text-xs" @click="openTopUpGasModal()">
      Top Up
    </CommonButton>
  </div>
</template>
