import { storeToRefs } from 'pinia'
import { gt } from 'semver'

const isVersionUpdateBannerHidden = ref(false)

export function useBanner() {
  const { gasBalance, pending } = storeToRefs(useSafe())
  const { account, chainId } = useWeb3()
  const { airDrop } = useAvocadoSafe()

  const wcStore = useWalletConnect()

  const { trackingAccount } = useAccountTrack()
  const isHideWelcomeBanner = useLocalStorage('hide-welcome-banner', false)
  const isOnboardHidden = computed(() =>
    useStatefulCookie(`hide-onboard-${account.value}`),
  )

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

    if (!airDrop.value)
      return false

    return true
  })

  const showOnboardBanner = computed(() => {
    if (!account.value)
      return false
    if (isOnboardHidden.value.value)
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
    if (!wcStore.sessions?.length)
      return []
    if (!allNetworkVersions.data.value?.length)
      return []

    return wcStore.sessions.filter((session) => {
      const version = allNetworkVersions.data.value.find(
        network => network.chainId === session.chainId,
      )
      if (!version)
        return false
      return version?.notdeployed
    })
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
    showTrackingBanner: computed(() => !!trackingAccount.value),
    toggleWelcomeBanner: (val: boolean) => (isHideWelcomeBanner.value = !val),
    hideOnboardBanner: () => (isOnboardHidden.value.value = true),
    hideVersionUpdateBanner: () => (isVersionUpdateBannerHidden.value = true),
  }
}
