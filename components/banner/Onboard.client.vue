<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'
import WaveSVG from '~/assets/images/icons/wave.svg?component'

const { hideOnboardBanner, isOnboardBannerVisible } = useBanner()
const { totalEoaBalance, eoaBalances, fundedEoaNetworks } = useAvocadoSafe()
</script>

<template>
  <div
    v-if="eoaBalances && eoaBalances.length > 0 && isOnboardBannerVisible"
    class="relative mx-auto flex w-full max-w-[832px] shrink-0 flex-col items-center justify-between gap-[15px] bg-[#4CA054] bg-opacity-60 px-5 py-[15px] text-xs backdrop-blur sm:flex-row sm:rounded-5"
  >
    <div class="flex items-start space-x-[25px] sm:items-center">
      <WaveSVG class="h-8 w-8" />
      <p class="w-5/6 leading-5 sm:w-fit">
        Welcome to Avocado 🥑 You have {{ formatUsd(totalEoaBalance?.toNumber()) }} of assets
        spread across {{ fundedEoaNetworks }} networks on your wallet (EOA). Transfer
        assets to your Avocado wallet to begin transacting.
      </p>
    </div>
    <div class="flex w-full items-center space-x-5 sm:w-fit">
      <CommonButton
        as="NuxtLink"
        :href="avoOnboardURL"
        target="_blank"
        size="sm"
        class="h-7.5 w-full justify-center sm:h-fit sm:w-fit"
      >
        Transfer
      </CommonButton>
      <button
        class="flex h-5 w-5 items-center justify-center rounded-full bg-white bg-opacity-20"
        @click="hideOnboardBanner()"
      >
        <SVGX class="text-slate-500 dark:text-white" />
      </button>
    </div>
  </div>
</template>
