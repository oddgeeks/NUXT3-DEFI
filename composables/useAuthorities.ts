export function useAuthorities() {
  const { selectedSafe, safeAddress, safesLoading } = storeToRefs(useSafe())
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { isAccountCanSign } = useMultisig()
  const { account } = useWeb3()

  const isWalletSecondary = computed(() => {
    if (safesLoading.value)
      return false
    return selectedSafe.value?.multisig === 1 && (!isAddressEqual(selectedSafe.value?.owner_address, account.value))
  })

  const authorisedNetworks = computed(() => {
    if (!account.value || !safeAddress?.value || !selectedSafe.value)
      return availableNetworks

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
