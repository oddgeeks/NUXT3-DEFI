import { isUndefined } from '@walletconnect/utils'
import { storeToRefs } from 'pinia'
import { gt } from 'semver'

const isVersionUpdateBannerHidden = ref(false)

export function useBanner() {
  const { gasBalance, safeOptions, selectedSafe } = storeToRefs(useSafe())
  const { isSafeMultisig, signers } = storeToRefs(useMultisig())
  const { account, chainId } = useWeb3()
  const { $pwa } = useNuxtApp()

  const wcStoreV2 = useWalletConnectV2()

  const { trackingAccount } = useAccountTrack()
  const isHideWelcomeBanner = useLocalStorage('hide-welcome-banner', false)
  const isHideRabbyBanner = useLocalStorage('hide-rabby-banner', false)
  const isOnboardHidden = useLocalStorage('hide-onboard', false)

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
      && chainId.value === avoChainId
      && lte(gasBalance.value, 0.1)
    )
  })

  const showIncorrectNetworkBanner = computed(
    () =>
      !trackingAccount.value && account.value && chainId.value !== avoChainId,
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

  const isMultisigOnboardBannerVisible = computed(() => {
    if (!selectedSafe.value || $pwa.needRefresh || showIncorrectNetworkBanner.value)
      return false

    if (signers.value?.length > 1)
      return false

    const isMultisigOnboardHidden = useLocalStorage(`multisig-hide-onboard-${selectedSafe.value.safe_address}`, false)

    return isSafeMultisig.value && !isMultisigOnboardHidden.value
  })

  const isOnboardBannerVisible = computed<boolean>(() => {
    if (!selectedSafe.value)
      return false

    return selectedSafe.value.multisig === 1 && selectedSafe.value.multisig_index === 0
  })

  const unstableDappNetworks = computed(() => {
    if (!wcStoreV2.sessions?.length)
      return []
    if (!safeOptions.value?.length)
      return []

    return false
  })

  return {
    showWelcomeBanner,
    showInsufficientGasBanner,
    showIncorrectNetworkBanner,
    showOnboardBanner,
    isVersionUpdateBannerHidden,
    showVersionUpdateBanner,
    unstableDappNetworks,
    isHideRabbyBanner,
    isOnboardBannerVisible,
    isMultisigOnboardBannerVisible,
    showTrackingBanner: computed(() => !!trackingAccount.value),
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
    hideMultisigOnboardBanner: () => {
      if (!selectedSafe.value)
        return

      const isMultisigOnboardHidden = useLocalStorage(`multisig-hide-onboard-${selectedSafe.value.safe_address}`, false)
      isMultisigOnboardHidden.value = true
    },
    hideOnboardBanner: () => (isOnboardHidden.value = true),
    hideRabbyBanner: () => (isHideRabbyBanner.value = true),
    hideVersionUpdateBanner: () => (isVersionUpdateBannerHidden.value = true),
  }
}
