<script setup>
const { showTrackingBanner, showWelcomeBanner } = useBanner()
</script>

<template>
  <div class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />
    <BannerWelcome v-if="showWelcomeBanner" />
    <div class="py-8 px-10">
      <TheHeader />
    </div>
    <WarningsGasBalance />
    <WarningsSwitchNetwork />
    <slot />
    <TheFooter />
  </div>
</template>
