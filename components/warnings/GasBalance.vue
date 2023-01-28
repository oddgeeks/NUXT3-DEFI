<template>
  <div
    class="bg-orange-400 gap-[15px] w-full justify-center flex bg-opacity-10 text-orange-400 rounded-5 p-4 text-sm text-center">
    <span class="text-xs self-center">
      Your gas balance is insufficient. Please top up to trigger transactions.
    </span>
    <CommonButton class="h-7.5 !px-4 flex items-center text-xs" @click="openTopUpGasModal()">Top up</CommonButton>
  </div>
</template>