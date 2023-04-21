<template>
  <div
    class="bg-green-400 gap-[15px] w-full justify-center flex sm:flex-row flex-col bg-opacity-10 text-green-400 rounded-5 p-4 text-sm text-center"
  >
    <div class="inline-flex items-center gap-2">
      <span class="text-base">⛽</span>
      <span class="text-xs self-center">
        Get started with Avocado by topping up gas using USDC
      </span>
    </div>
    <CommonButton class="h-7.5 !px-4 flex justify-center text-xs" @click="openTopUpGasModal()">
      Top Up
    </CommonButton>
  </div>
</template>
