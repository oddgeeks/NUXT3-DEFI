<script setup lang="ts">
const {
  showTrackingBanner,
  showIncorrectNetworkBanner,
  showInsufficientGasBanner,
  showOnboardBanner,
  showVersionUpdateBanner,
} = useBanner()
const route = useRoute()
const router = useRouter()
const lastNoticeShowDate = useLocalStorage<Date>('last_update_notice_show_date', new Date(0, 0))
const welcomeMessageShow = useLocalStorage<Boolean>('welcome_message_check', false)

watch(showVersionUpdateBanner, () => {
  if (showVersionUpdateBanner.value) {
    const today = new Date()
    const differenceInDays = (today.getTime() - lastNoticeShowDate.value.getTime()) / (1000 * 3600 * 24)
    if (differenceInDays >= 3 && router.currentRoute.value.name !== 'upgrade')
      openUpdateNoticeModal()
  }
})

if (!welcomeMessageShow.value)
  openWelcomeModal()
</script>

<template>
  <section class="flex flex-col h-full">
    <BannerAccountTracking v-if="showTrackingBanner" />

    <div class="flex">
      <Sidebar />

      <div
        class="flex flex-1 flex-col sm:px-10 px-4 max-w-7xl mx-auto min-w-0"
      >
        <TheHeader />
        <div class="container flex flex-col gap-4 mt-32 sm:mt-0">
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
