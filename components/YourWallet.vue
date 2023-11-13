<script setup lang="ts">
import EyeSVG from '@/assets/images/icons/eye.svg?component'

const { safeAddress } = useAvocadoSafe()
const account = computed(() => safeAddress.value || '0x000000000000000')

function openModal() {
  if (account.value === '0x000000000000000')
    return
  openYourWalletModal(account.value)
}
</script>

<template>
  <div
    class="flex items-center justify-between rounded-5 bg-gray-850 px-4.5 py-4 sm:hidden"
    @click="openModal"
  >
    <div class="flex items-center space-x-[17px]">
      <div class="flex items-center justify-center rounded-[8px] bg-white p-1">
        <StyledQrCode :key="account" class="mx-auto overflow-hidden" :class="{ 'blur-sm': account === '0x000000000000000' }" :size="32" :margin="0" :data="account" />
      </div>
      <div class="flex flex-col space-y-1">
        <span>Your Avo Wallet</span>
        <span v-if="account !== '0x000000000000000'" class="font-[14px] text-gray-400">{{ shortenHash(account) }}</span>
        <svg v-else width="120" height="20" viewBox="0 0 120 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="20" rx="8" class="fill-gray-900" />
        </svg>
      </div>
    </div>
    <EyeSVG v-if="account !== '0x000000000000000'" class="text-gray-400" />
  </div>
</template>
