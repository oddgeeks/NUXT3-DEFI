import { gt } from 'semver'

const isVersionUpdateBannerHidden = ref(false)

export function useBanner() {
  const { gasBalance, pending } = storeToRefs(useSafe())
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { account, chainId } = useWeb3()

  const wcStoreV2 = useWalletConnectV2()

  const { trackingAccount } = useAccountTrack()
  const isHideWelcomeBanner = useLocalStorage('hide-welcome-banner', false)
  const isHideRabbyBanner = useLocalStorage('hide-rabby-banner', false)
  const isOnboardHidden = useLocalStorage('hide-onboard', false)

  const allNetworkVersions = useNuxtData('allNetworkVersions')

  const showWelcomeBanner = computed(() => {
    if (!account.value)
      return false
    if (isHideWelcomeBanner.value)
      return false
    return true
  })

  const showInsufficientGasBanner = computed(() => {
    if (pending.value.global)
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

  const showGasGiftBanner = computed(() => {
    if (!account.value)
      return false
    if (chainId.value !== avoChainId)
      return false
    if (pending.value.global)
      return false

    return true
  })

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
    const allVersions = allNetworkVersions.data.value as NetworkVersion[]
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

  const unstableDappNetworks = computed(() => {
    if (!wcStoreV2.sessions?.length)
      return []
    if (!allNetworkVersions.data.value?.length)
      return []

    return false
  })

  return {
    showWelcomeBanner,
    showInsufficientGasBanner,
    showIncorrectNetworkBanner,
    showGasGiftBanner,
    showOnboardBanner,
    isVersionUpdateBannerHidden,
    showVersionUpdateBanner,
    unstableDappNetworks,
    isHideRabbyBanner,
    showTrackingBanner: computed(() => !!trackingAccount.value),
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
    hideOnboardBanner: () => (isOnboardHidden.value = true),
    hideRabbyBanner: () => (isHideRabbyBanner.value = true),
    hideVersionUpdateBanner: () => (isVersionUpdateBannerHidden.value = true),
  }
}
