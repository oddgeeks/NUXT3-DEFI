export function useAccountState() {
  const { account } = useWeb3()
  const { legacySafe, legacySafeAddress } = storeToRefs(useSafe())

  const userToggleHideLegacy = useLocalStorage('hide-legacy-safe', false)
  const isHideZeroBalances = useLocalStorage('hide-zero-balances', false)
  const listType = useLocalStorage('listType', 'individual')

  const accountPinnedSafeMapping = useLocalStorage<Record<string, string[]>>('account-safe-pin-mapping', {})

  const pinnedSafes = computed(() => {
    if (!account.value)
      return []

    const mapping = accountPinnedSafeMapping.value || {}

    return mapping[account.value] || []
  })

  const togglePinSafe = (safeAddress: string) => {
    if (!account.value)
      return

    const mapping = accountPinnedSafeMapping.value || {}

    if (!mapping[account.value])
      mapping[account.value] = []

    const index = mapping[account.value].indexOf(safeAddress)

    if (index === -1)
      mapping[account.value].push(safeAddress)
    else
      mapping[account.value].splice(index, 1)

    accountPinnedSafeMapping.value = mapping
  }

  function isSafePinned(safeAddress: string) {
    return pinnedSafes.value.some(i => i.toLowerCase() === safeAddress.toLowerCase())
  }

  const displayLegacySafe = computed(() => {
    return legacySafeAddress.value && legacySafe.value && userToggleHideLegacy.value
  })

  return {
    pinnedSafes,
    togglePinSafe,
    isSafePinned,
    displayLegacySafe,
    userToggleHideLegacy,
    isHideZeroBalances,
    listType,
  }
}
