<script lang="ts" setup>
import GloveSVG from '~/assets/images/icons/globe.svg?component';
const { switchNetworkByChainId } = useNetworks();
</script>

<template>
  <div
    class="w-full max-w-[832px] mx-auto text-xs relative bg-[#EC974F] bg-opacity-70 py-[15px] px-6 rounded-5 backdrop-blur shrink-0 flex justify-between items-center gap-[15px]"
  >
    <div class="flex space-x-[12px] items-center">
      <GloveSVG class="w-8 h-8" />
      <p class="text-white leading-5">
        It seems you’re connected to wrong network. Please switch to Avocado Network or add the network on Metamask.
      </p>
    </div>
    <CommonButton @click="switchNetworkByChainId(634)" class="whitespace-nowrap" target="_blank" size="sm">
      Switch Network
    </CommonButton>
  </div>
</template>