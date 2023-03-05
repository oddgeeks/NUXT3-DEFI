<script setup lang="ts">
const { modals } = useModal();
const {
  showTrackingBanner,
  showWelcomeBanner,
  showIncorrectNetworkBanner,
  showInsufficientGasBanner,
  showGasGiftBanner,
  showOnboardBanner,
} = useBanner();

const route = useRoute();
</script>

<template>
  <div class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />
    <!-- <BannerWelcome v-if="showWelcomeBanner" /> -->
    <div class="fixed bottom-12 w-full z-40">
      <BannerSwitchNetwork v-if="showIncorrectNetworkBanner" />
      <BannerOnboard v-else-if="showOnboardBanner && route.name !== 'claims-ens-drop'" />
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
      <!-- <BannerGift v-if="showGasGiftBanner" /> -->
      <WarningsGasBalance v-if="showInsufficientGasBanner" />
    </div>
    <div class="mt-36 sm:mt-0">
      <slot />
    </div>
    <TheFooter />
    <Modal
      @destroy="modal.destroy"
      @reject="modal.onReject"
      :key="modal.id"
      v-bind="modal"
      :show="true"
      v-for="modal in modals"
    >
      <component
        :is="modal.component"
        @destroy="modal.destroy"
        @resolve="modal.onResolve"
        @reject="modal.onReject"
        v-bind="modal.componentProps"
      />
    </Modal>
  </div>
</template>
