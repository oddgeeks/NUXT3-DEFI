<script lang="ts" setup>
import GloveSVG from '~/assets/images/icons/globe.svg?component';
const { switchNetworkByChainId } = useNetworks();
</script>

<template>
  <div
    class="w-full max-w-[832px] mx-auto text-xs relative bg-[#EC974F] bg-opacity-60 py-[15px] px-5 sm:rounded-5 backdrop-blur shrink-0 flex flex-col sm:flex-row justify-between items-center gap-[15px]"
  >
    <div class="flex space-x-[12px] items-start sm:items-center">
      <GloveSVG class="w-8 h-8" />
      <p class="leading-5 w-5/6 sm:w-full">
        You're connected to the wrong network. Please switch to Avocado Network.
      </p>
    </div>
    <CommonButton @click="switchNetworkByChainId(634)" class="whitespace-nowrap w-full h-7.5 sm:h-fit sm:w-fit justify-center" target="_blank" size="sm">
      Switch Network
    </CommonButton>
  </div>
</template>