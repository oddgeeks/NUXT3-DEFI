<script setup lang="ts">
import { gt } from 'semver'

const {
  showTrackingBanner,
  showIncorrectNetworkBanner,
  showInsufficientGasBanner,
  showOnboardBanner,
  showVersionUpdateBanner,
} = useBanner()

const route = useRoute()
const router = useRouter()
const { migrateOldContacts } = useContacts()
const { allNetworkVersions } = storeToRefs(useSafe())

const lastNoticeShowDate = useLocalStorage<Date>('last_update_notice_show_date', new Date(0, 0))
const ignore_version = useLocalStorage<NetworkVersion[]>('ignore_version', [])

function isIgnoreVersion() {
  return !(allNetworkVersions.value.some((network) => {
    if (network.notdeployed)
      return false

    if (gt(network.latestVersion, network.currentVersion)) {
      if (ignore_version.value.findIndex(net => net.chainId === network.chainId && net.latestVersion === network.latestVersion) == -1)
        return true
    }
    return false
  }))
}

const welcomeMessageShow = useLocalStorage<Boolean>('welcome_message_check', false)

watch(showVersionUpdateBanner, async () => {
  if (showVersionUpdateBanner.value) {
    const today = new Date()
    const differenceInDays = (today.getTime() - lastNoticeShowDate.value.getTime()) / (1000 * 3600 * 24)
    if (differenceInDays >= 3 && router.currentRoute.value.name !== 'upgrade' && !isIgnoreVersion()) {
      const res = await openUpdateNoticeModal()
      if (!res.success)
        ignore_version.value = allNetworkVersions.value
    }
  }
})

onMounted(() => {
  if (!welcomeMessageShow.value)
    openWelcomeModal()

  migrateOldContacts()
})
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
    <div class="fixed bottom-0 sm:bottom-12 sm:w-auto w-full left-1/2 -translate-x-1/2 z-40">
      <BannerSwitchNetwork v-if="showIncorrectNetworkBanner" />
      <BannerOnboard
        v-else-if="showOnboardBanner && route.name !== 'claims-ens-drop'"
      />
    </div>
  </section>
</template>
