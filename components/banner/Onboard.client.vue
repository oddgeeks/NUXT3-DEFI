<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'
import WaveSVG from '~/assets/images/icons/wave.svg?component'

const { hideOnboardBanner } = useBanner()
const { totalEoaBalance, eoaBalances, fundedEoaNetworks } = useAvocadoSafe()
</script>

<template>
  <div
    v-if="eoaBalances && eoaBalances.length > 0"
    class="w-full max-w-[832px] mx-auto text-xs relative bg-[#4CA054] bg-opacity-60 py-[15px] px-5 sm:rounded-5 backdrop-blur shrink-0 flex flex-col sm:flex-row justify-between items-center gap-[15px]"
  >
    <div class="flex space-x-[25px] items-start sm:items-center">
      <WaveSVG class="w-8 h-8" />
      <p class="leading-5 w-5/6 sm:w-fit">
        Welcome to Avocado 🥑 You have {{ formatUsd(totalEoaBalance?.toNumber()) }} of assets
        spread across {{ fundedEoaNetworks }} networks on your wallet (EOA). Transfer
        assets to your Avocado wallet to begin transacting.
      </p>
    </div>
    <div class="flex space-x-5 items-center w-full sm:w-fit">
      <CommonButton
        as="NuxtLink"
        :href="avoOnboardURL"
        target="_blank"
        size="sm"
        class="w-full sm:w-fit h-7.5 sm:h-fit justify-center"
      >
        Transfer
      </CommonButton>
      <button
        class="w-5 h-5 rounded-full flex items-center justify-center bg-white bg-opacity-20"
        @click="hideOnboardBanner()"
      >
        <SVGX class="dark:text-white text-slate-500" />
      </button>
    </div>
  </div>
</template>
