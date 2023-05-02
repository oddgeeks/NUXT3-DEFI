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
    <div class="fixed bottom-0 sm:bottom-12 w-full z-40">
      <BannerSwitchNetwork v-if="showIncorrectNetworkBanner" />
      <BannerOnboard
        v-else-if="showOnboardBanner && route.name !== 'claims-ens-drop'"
      />
    </div>
    <div class="flex">
      <Sidebar class="hidden sm:flex h-screen" />
      <div class="flex flex-col flex-1 h-screen overflow-y-auto">
        <BannerAccountTracking v-if="showTrackingBanner" class="hidden sm:flex" />
        <div class="py-8 px-10 hidden sm:block">
          <TheHeader />
        </div>
        <slot />
        <TheFooter />
      </div>
    </div>
    <div class="fixed w-full z-40 sm:hidden">
      <BannerAccountTracking v-if="showTrackingBanner" class="!bg-[#18242c]" />
      <div
        class="py-8 px-10 bg-gray-50 dark:bg-gray-850 z-40 rounded-b-7.5 w-full transition-transform"
      >
        <MobileHeader />
      </div>
    </div>
    <div
      class="container flex flex-col gap-4 banner-wrapper mt-36 sm:mt-0 [&:not(:empty)]:mb-7.5"
      :class="{ 'mt-44': showTrackingBanner }"
    >
      <WarningsGasBalance v-if="showInsufficientGasBanner" />
    </div>
  </section>
</template>
