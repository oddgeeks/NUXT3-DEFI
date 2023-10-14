<script setup lang="ts"></script>

<template>
  <div class="flex items-center justify-center gap-[15px] rounded-5 bg-green-400 bg-opacity-10 py-[15px]">
    <span>🎁</span>
    <p class="text-xs text-green-400">
      Claim your gas gift to start trying out Avocado
    </p>
    <CommonButton class="flex h-7.5 items-center !px-4 text-xs" @click="openTopUpGasModal()">
      Claim Gas
    </CommonButton>
  </div>
</template>
