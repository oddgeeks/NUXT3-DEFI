<script setup lang="ts">
const {
  showTrackingBanner,
  showIncorrectNetworkBanner,
  showInsufficientGasBanner,
  showOnboardBanner,
} = useBanner();

const route = useRoute();
</script>

<template>
  <div class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />
    <div class="fixed bottom-12 w-full z-40">
      <BannerSwitchNetwork v-if="showIncorrectNetworkBanner" />
      <BannerOnboard
        v-else-if="showOnboardBanner && route.name !== 'claims-ens-drop'"
      />
    </div>
    <div class="py-8 px-10 hidden sm:block">
      <TheHeader />
    </div>
    <div class="fixed py-8 px-10 bg-gray-50 dark:bg-gray-850 z-40 rounded-b-7.5 w-full sm:hidden transition-transform">
      <MobileHeader />
    </div>
    <div
      class="container flex flex-col gap-4 banner-wrapper [&:not(:empty)]:mb-7.5"
    >
      <WarningsGasBalance v-if="showInsufficientGasBanner" />
    </div>
    <div class="mt-36 sm:mt-0">
      <slot />
    </div>
    <TheFooter />
  </div>
</template>
