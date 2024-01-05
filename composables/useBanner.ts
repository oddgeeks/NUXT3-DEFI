import { isUndefined } from '@walletconnect/utils'
import { storeToRefs } from 'pinia'
import { gt } from 'semver'

const isVersionUpdateBannerHidden = ref(false)

export function useBanner() {
  const { gasBalance, safeOptions, selectedSafe, isSelectedSafeLegacy } = storeToRefs(useSafe())
  const { isSafeMultisig, signers } = storeToRefs(useMultisig())
  const { avoChainId } = storeToRefs(useEnvironmentState())
  const { account, chainId } = useWeb3()
  const { $pwa } = useNuxtApp()
  const route = useRoute()

  const { trackingAccount } = useAccountTrack()
  const isHideWelcomeBanner = useLocalStorage('hide-welcome-banner', false)
  const isHideRabbyBanner = useLocalStorage('hide-rabby-banner', false)
  const isHideMigrationBanner = useLocalStorage('hide-migration-banner', false)
  const isOnboardHidden = useLocalStorage('hide-onboard', false)
  const isAnnouncementHidden = useLocalStorage('hide-announcement', false)

  const [isMultisigOnboardHiddenToggle, toggle] = useToggle(false)

  const showWelcomeBanner = computed(() => {
    if (!account.value)
      return false
    if (isHideWelcomeBanner.value)
      return false
    return true
  })

  const showInsufficientGasBanner = computed(() => {
    if (isUndefined(gasBalance.value))
      return false

    return (
      account.value
      && chainId.value === avoChainId.value
      && lte(gasBalance.value, 0.1)
    )
  })

  const showIncorrectNetworkBanner = computed(
    () =>
      !trackingAccount.value && account.value && chainId.value !== avoChainId.value,
  )

  const showOnboardBanner = computed(() => {
    if (!account.value)
      return false
    if (isOnboardHidden.value)
      return false
    if (isSafeMultisig.value)
      return false

    return true
  })

  const showVersionUpdateBanner = computed(() => {
    if (!account.value)
      return false
    const allVersions = safeOptions.value
    if (!allVersions?.length)
      return false
    if (isVersionUpdateBannerHidden.value)
      return false

    return allVersions.some((network) => {
      if (network.notdeployed)
        return false

      return gt(network.latestVersion, network.currentVersion)
    },
    )
  })

  const isAnnouncementBannerVisible = computed(() => {
    if (!account.value)
      return false

    const userNonce = useCookie<string | null>(`nonce-${account.value}`)

    if (!userNonce.value)
      return false

    return !isAnnouncementHidden.value
  },
  )

  const isMultisigOnboardBannerVisible = computed(() => {
    if (!selectedSafe.value || $pwa?.needRefresh || showIncorrectNetworkBanner.value)
      return false

    if (signers.value?.length > 1)
      return false

    const isMultisigOnboardHidden = useLocalStorage(`multisig-hide-onboard-${selectedSafe.value.safe_address}`, false)

    console.log(isMultisigOnboardHiddenToggle.value)

    return route.path === '/' && isSafeMultisig.value && !isMultisigOnboardHidden.value
  })

  const isOnboardBannerVisible = computed<boolean>(() => {
    if (!selectedSafe.value)
      return false

    return selectedSafe.value.multisig === 1 && selectedSafe.value.multisig_index === 0
  })

  const isMigrationBannerVisible = computed(() => {
    if (!selectedSafe.value || showInsufficientGasBanner.value || route?.path === '/migration')
      return false

    return !isHideMigrationBanner.value && isSelectedSafeLegacy.value
  })

  return {
    showWelcomeBanner,
    showInsufficientGasBanner,
    showIncorrectNetworkBanner,
    showOnboardBanner,
    isVersionUpdateBannerHidden,
    showVersionUpdateBanner,
    isHideRabbyBanner,
    isOnboardBannerVisible,
    isMultisigOnboardBannerVisible,
    isAnnouncementBannerVisible,
    isMigrationBannerVisible,
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
    hideMultisigOnboardBanner: () => {
      if (!selectedSafe.value)
        return

      const isMultisigOnboardHidden = useLocalStorage(`multisig-hide-onboard-${selectedSafe.value.safe_address}`, false)
      isMultisigOnboardHidden.value = true
      toggle()
    },
    hideOnboardBanner: () => (isOnboardHidden.value = true),
    hideRabbyBanner: () => (isHideRabbyBanner.value = true),
    hideVersionUpdateBanner: () => (isVersionUpdateBannerHidden.value = true),
    hideAnnouncementBanner: () => (isAnnouncementHidden.value = true),
    hideMigrationBanner: () => (isHideMigrationBanner.value = true),
  }
}
