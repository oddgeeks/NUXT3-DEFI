export function useAuthorities() {
  const { selectedSafe, mainSafe, safeAddress } = storeToRefs(useSafe())

  const isWalletSecondary = computed(() => selectedSafe.value?.multisig !== 1 && (mainSafe.value?.safe_address !== selectedSafe.value?.safe_address))

  const { account } = useWeb3()

  const authorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities)
  })

  const authorisedNetworks = computed(() => {
    if (!account.value || !safeAddress?.value || !isWalletSecondary.value)
      return availableNetworks

    const auth = authorities.value.find(i => i.address === account.value)

    return auth?.chainIds.map(i => getNetworkByChainId(i))
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
