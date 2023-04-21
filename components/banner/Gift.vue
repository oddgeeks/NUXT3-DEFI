<script setup lang="ts"></script>

<template>
  <div class="bg-green-400 bg-opacity-10 rounded-5 py-[15px] items-center justify-center flex gap-[15px]">
    <span>🎁</span>
    <p class="text-green-400 text-xs">
      Claim your gas gift to start trying out Avocado
    </p>
    <CommonButton class="h-7.5 !px-4 flex items-center text-xs" @click="openTopUpGasModal()">
      Claim Gas
    </CommonButton>
  </div>
</template>
