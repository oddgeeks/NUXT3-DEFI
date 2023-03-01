<template>
  <div
    class="bg-green-400 gap-[15px] w-full justify-center flex bg-opacity-10 text-green-400 rounded-5 p-4 text-sm text-center">
    <span class="text-xs self-center">
      Get started with Avocado by topping up gas using USDC
    </span>
    <CommonButton class="h-7.5 !px-4 flex items-center text-xs" @click="openTopUpGasModal()">Deposit USDC</CommonButton>
  </div>
</template>