<script setup lang="ts">
const { showTrackingBanner, showWelcomeBanner, showIncorrectNetworkBanner, showInsufficientGasBanner, showGasGiftBanner } = useBanner()
</script>

<template>
  <div class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />
    <BannerWelcome v-if="showWelcomeBanner" />
    <div class="py-8 px-10">
      <TheHeader />
    </div>
    <div class="container flex flex-col gap-4 banner-wrapper [&:not(:empty)]:mb-7.5">
      <WarningsGasBalance v-if="showInsufficientGasBanner" />
      <WarningsSwitchNetwork v-if="showIncorrectNetworkBanner" />
      <BannerGift v-if="showGasGiftBanner" />
    </div>
    <slot />
    <TheFooter />
  </div>
</template>