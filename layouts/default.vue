<script setup lang="ts">
const {
  showTrackingBanner,
  showIncorrectNetworkBanner,
  showInsufficientGasBanner,
  showOnboardBanner,
} = useBanner()

const route = useRoute()
</script>

<template>
  <section class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />

    <div class="flex ">
      <Sidebar />

      <div class="flex flex-1 flex-col sm:px-10 px-4 max-w-7xl mx-auto">
        <TheHeader />
        <div
          class="container flex flex-col gap-4 mt-32 sm:mt-0"
        >
          <WarningsGasBalance v-if="showInsufficientGasBanner" />
        </div>
        <slot />
        <TheFooter />
      </div>
    </div>
    <div class="fixed bottom-0 sm:bottom-12 w-full z-40">
      <BannerSwitchNetwork v-if="showIncorrectNetworkBanner" />
      <BannerOnboard
        v-else-if="showOnboardBanner && route.name !== 'claims-ens-drop'"
      />
    </div>
  </section>
</template>
