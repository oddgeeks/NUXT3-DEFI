export function useAccountTrack(onSuccess?: () => void, onFailure?: () => void) {
  const { account } = useWeb3()
  const trackingAccount = useCookie<string | null>('trackAccount', {
    default: () => null,
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  })

  const actualTrackingAccount = computed({
    get: () => {
      if (process.server)
        return null

      return trackingAccount.value
    },
    set: (value: string | null) => {
      trackingAccount.value = value
    },
  })

  const route = useRoute()

  const init = async () => {
    if (route.query?.user) {
      trackingAccount.value = route.query.user as string

      // replace URL without triggering route change
      if (process.client) {
        const url = new URL(window.location.href)
        url.searchParams.delete('user')
        window.history.replaceState({}, '', url.toString())
      }
    }
    if (trackingAccount.value) {
      account.value = trackingAccount.value
      onSuccess?.()
    }
    else {
      onFailure?.()
    }
  }

  onNuxtReady(init)

  const isTrackingMode = computed(() => {
    return !!trackingAccount.value && trackingAccount.value !== ''
  })

  return {
    trackingAccount: actualTrackingAccount,
    isTrackingMode,
  }
}
