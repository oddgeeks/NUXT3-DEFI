<script lang="ts" setup>
import GloveSVG from '~/assets/images/icons/globe.svg?component'

const { switchToAvocadoNetwork } = useNetworks()
</script>

<template>
  <div
    class="relative mx-auto flex w-full max-w-[832px] shrink-0 flex-col items-center justify-between gap-[15px] bg-[#EC974F] bg-opacity-60 px-5 py-[15px] text-xs backdrop-blur sm:flex-row sm:rounded-5"
  >
    <div class="flex items-start space-x-[12px] sm:items-center">
      <GloveSVG class="h-8 w-8" />
      <p class="w-5/6 leading-5 sm:w-full">
        You're connected to the wrong network. Please switch to Avocado Network.
      </p>
    </div>
    <CommonButton class="h-7.5 w-full justify-center whitespace-nowrap sm:h-fit sm:w-fit" target="_blank" size="sm" @click="switchToAvocadoNetwork()">
      Switch Network
    </CommonButton>
  </div>
</template>
