<script setup lang="ts">
import LinkSVG from "~/assets/images/icons/external-link.svg?component";

defineProps({
  address: String
});

const { networks } = useNetworks();
const availableNetworks = networks.filter((network) => network.chainId != 634);
</script>

<template>
  <div class="flex flex-col items-center gap-7.5">
    <span class="text-lg">Your Avocado Wallet</span>

    <StyledQrCode :size="220" :margin="16" class="rounded-5 mx-auto bg-white overflow-hidden" :data="address"
      :key="address" />

    <Copy class="text-xl" :text="address" v-if="address">
      <template #content>
        {{ shortenHash(address) }}
      </template>
    </Copy>

    <div class="flex flex-col items-center gap-4">
      <span>Supported Chains</span>
      <div class="flex gap-2 justify-center flex-wrap ">
        <div v-for="network in availableNetworks"
          class="flex items-center gap-2 text-[10px] p-1.5 bg-slate-50 dark:bg-gray-850 rounded-full">
          <ChainLogo style="width: 14px; height: 14px" :chain="network.chainId" />
          <span>{{ network.name }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2.5 items-center">
      <div class="font-semibold text-xs leading-6 text-center">
        Send funds to your Avocado wallet using the details above on any supported chain
      </div>

      <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-xs font-medium inline-flex items-center gap-2.5 text-primary'>
        <span class="underline underline-offset-4">Learn more about how to deposit</span>
        <LinkSVG class="w-4 h-4" />
      </a>
    </div>
  </div>
</template>