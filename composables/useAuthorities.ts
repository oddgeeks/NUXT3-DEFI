export function useAuthorities() {
  const { selectedSafe, mainSafe, safeAddress, atLeastOneMfaVerifed } = storeToRefs(useSafe())
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { isAccountCanSign, isInstadappSignerAdded } = useMultisig()

  const isWalletSecondary = computed(() => selectedSafe.value?.multisig !== 1 && (mainSafe.value?.safe_address !== selectedSafe.value?.safe_address))

  const { account } = useWeb3()

  const authorisedNetworks = computed(() => {
    if (!account.value || !safeAddress?.value || !selectedSafe.value)
      return availableNetworks

    if (atLeastOneMfaVerifed.value)
      return availableNetworks.filter(i => isInstadappSignerAdded(i.chainId))

    if (isSafeMultisig.value)

      return availableNetworks.filter(i => isAccountCanSign(i.chainId, account.value, selectedSafe.value?.owner_address))

    else
      return availableNetworks
  })

  function checkNetworkIsAuthorised(chainId: string | number) {
    return !!authorisedNetworks.value?.find(i => i.chainId == chainId)
  }

  return {
    authorisedNetworks,
    checkNetworkIsAuthorised,
    isWalletSecondary,
  }
}
