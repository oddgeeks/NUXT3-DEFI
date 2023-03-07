<script setup lang="ts">
const { networks } = useNetworks();
const { safeAddress } = useAvocadoSafe();
const account = computed(() => safeAddress.value || "0x000000000000000");

const availableNetworks = networks.filter((network) => network.chainId != 634);

const shortenAddress = () => {
  return account.value.substr(0, 6) + "..." + account.value.substr(-4);
};
</script>

<template>
  <div class="flex flex-col items-center gap-7.5">
    <span class="text-lg">Your Avocado Wallet</span>

    <StyledQrCode :size="220" :margin="16" class="rounded-5 mx-auto bg-white overflow-hidden" :data="account"
      :key="account" />

    <Copy class="mt-5 text-xl" :text="account">
      <template #content>
        {{ shortenAddress() }}
      </template>
    </Copy>

    <div class="flex flex-col items-center gap-4">
      <span>Supported Chains</span>
      <div class="flex gap-2 justify-center flex-wrap ">
        <div v-for="network in availableNetworks"
          class="flex items-center gap-2 text-[10px] p-1.5 bg-slate-50 dark:bg-gray-850 rounded-full">
          <ChainLogo style="width: 22px; height: 22px" :chain="network.chainId" />
          <span>{{ network.name }}</span>
        </div>
      </div>
    </div>

    <div class="bg-[#4CA05433] text-green-400 font-semibold text-xs leading-6 px-4 py-2.5 rounded-5 text-center">
      Deposit or receive funds by scanning or copying your AvoSafe QR code. You can deposit or receive from any
      supported chains.
    </div>
  </div>
</template>