<script setup lang="ts">
import EyeSVG from '@/assets/images/icons/eye.svg?component';

const { safeAddress } = useAvocadoSafe();
const account = computed(() => safeAddress.value || "0x000000000000000");

const openModal = () => {
  if (account.value === '0x000000000000000') return;
  openYourWalletModal(account.value);
};
</script>

<template>
  <div @click="openModal"
    class="flex items-center justify-between px-4.5 py-4 bg-slate-50 dark:bg-gray-850 sm:hidden rounded-5">
    <div class="flex space-x-[17px] items-center">
      <div class="p-1 bg-white rounded-[8px] flex justify-center items-center">
        <StyledQrCode class="mx-auto overflow-hidden" :class="{ 'blur-sm': account === '0x000000000000000' }" :size="32" :margin="0" :data="account" :key="account" />
      </div>
      <div class="flex flex-col space-y-1">
        <span>Your Avo Wallet</span>
        <span v-if="account !== '0x000000000000000'" class="text-slate-400 font-[14px]">{{ shortenHash(account) }}</span>
        <svg v-else width="120" height="20" viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="20" rx="8" class="dark:fill-slate-800 fill-slate-200" />
        </svg>
      </div>
    </div>
    <EyeSVG v-if="account !== '0x000000000000000'" class="text-slate-400" />
  </div>
</template>