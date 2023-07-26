export function useAuthorities() {
  const { selectedSafe, mainSafe, safeAddress } = storeToRefs(useSafe())
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { isAccountCanSign } = useMultisig()

  const isWalletSecondary = computed(() => selectedSafe.value?.multisig !== 1 && (mainSafe.value?.safe_address !== selectedSafe.value?.safe_address))

  const { account } = useWeb3()

  const authorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities)
  })

  const authorisedNetworks = computed(() => {
    if (!account.value || !safeAddress?.value || !selectedSafe.value)
      return availableNetworks

    if (!isSafeMultisig.value) {
      if (!isWalletSecondary.value)
        return availableNetworks

      const auth = authorities.value.find(i => i.address === account.value)

      return auth?.chainIds.map(i => getNetworkByChainId(i))
    }
    else {
      return availableNetworks.filter(i => isAccountCanSign(i.chainId, account.value, selectedSafe.value?.owner_address))
    }
  })

  function checkNetworkIsAuthorised(chainId: string | number) {
    return !!authorisedNetworks.value?.find(i => i.chainId == chainId)
  }

  return {
    authorities,
    authorisedNetworks,
    checkNetworkIsAuthorised,
    isWalletSecondary,
  }
}
