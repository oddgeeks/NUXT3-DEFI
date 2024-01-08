export const useSafeUtils = defineStore('safe-utils', () => {
  const { checkSafeIsActualMultisig } = useMultisig()

  const safeLabelStorageKey = 'safe-label'

  function getStorageSafeLabel(safeAddress: string) {
    return useLocalStorage<string | null>(`${safeLabelStorageKey}-${safeAddress}`, null)
  }

  function getFallbackLabel(safe?: ISafe) {
    if (!safe)
      return null

    const isMultisig = checkSafeIsActualMultisig(safe)

    const isLegacy = safe.multisig === 0

    return isMultisig ? 'MultiSig' : isLegacy ? 'Legacy' : 'Personal'
  }

  function getWalletLabel(safe?: ISafe) {
    if (!safe)
      return null

    const fallback = getFallbackLabel(safe)

    return getStorageSafeLabel(safe.safe_address)?.value || fallback
  }

  return {
    getWalletLabel,
    getFallbackLabel,
    getStorageSafeLabel,
    safeLabelStorageKey,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSafeUtils, import.meta.hot))
