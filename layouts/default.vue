<script setup lang="ts">
const { modals } = useModal();
const {
  showTrackingBanner,
  showWelcomeBanner,
  showIncorrectNetworkBanner,
  showInsufficientGasBanner,
  showGasGiftBanner,
  showOnboardBanner
} = useBanner();
</script>

<template>
  <div class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />
    <BannerWelcome v-if="showWelcomeBanner" />
    <BannerOnboard v-if="showOnboardBanner" />
    <div class="py-8 px-10">
      <TheHeader />
    </div>
    <div
      class="container flex flex-col gap-4 banner-wrapper [&:not(:empty)]:mb-7.5"
    >
      <!-- <BannerGift v-if="showGasGiftBanner" /> -->
      <WarningsGasBalance v-if="showInsufficientGasBanner" />
      <WarningsSwitchNetwork v-if="showIncorrectNetworkBanner" />
    </div>
    <slot />
    <TheFooter />
    <Modal @destroy="modal.destroy" @reject="modal.onReject" :key="modal.id" v-bind="modal" :show="true" v-for="modal in modals">
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
