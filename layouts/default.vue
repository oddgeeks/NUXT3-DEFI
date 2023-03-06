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
    <div class="py-8 px-10">
      <TheHeader />
    </div>
    <div
      class="container flex flex-col gap-4 banner-wrapper [&:not(:empty)]:mb-7.5"
    >
      <WarningsGasBalance v-if="showInsufficientGasBanner" />
    </div>
    <slot />
    <TheFooter />
  </div>
</template>
