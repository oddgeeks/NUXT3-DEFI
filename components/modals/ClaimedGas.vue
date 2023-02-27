<script setup lang="ts">
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <span class="text-left text-lg font-semibold">What you can do on Avocado with your claimed gas</span>
    <div class="flex flex-col gap-5">
      <div
        v-for="ability in ['Deposit tokens to your avo wallet first', 'Connect your favorite dapps and making txns using USDC', 'Swap tokens', 'Bridge tokens']"
        class="flex items-center gap-2">
        <CheckCircle class="text-white w-4 h-4 success-circle" />
        <span class="text-slate-400 font-medium text-[12px] leading-5">{{ ability }}</span>
      </div>
    </div>
  </div>
</template>