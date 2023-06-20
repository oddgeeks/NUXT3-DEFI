import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'

export const useAuthorities = defineStore('authorities', () => {
  const avoProvider = getRpcProvider(avoChainId)

  const safes = ref<ISafe[]>([])
  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()
  const multiSigSafe = ref<ISafe>()

  const { safeAddress, mainSafeAddress, multiSigSafeAddress } = storeToRefs(useSafe())
  const { account } = useWeb3()

  const authorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities)
  })

  const isWalletSecondary = computed(() => selectedSafe.value?.multisig !== 1 && (mainSafe.value?.safe_address !== selectedSafe.value?.safe_address))

  const authorisedNetworks = computed(() => {
    if (!account.value || !safeAddress?.value || !isWalletSecondary.value)
      return availableNetworks

    const auth = authorities.value.find(i => i.address === account.value)

    return auth?.chainIds.map(i => getNetworkByChainId(i))
  })

  const fetchSafes = async () => {
    const resp = await avoProvider.send('api_getSafes', [{
      authority_address: account.value,
    }])

    safes.value = resp?.data || []
  }

  const fetchSafe = async (address: string) => {
    return avoProvider.send('api_getSafe', [address])
  }

  async function setSafe() {
    const resp = await fetchSafe(safeAddress.value)

    selectedSafe.value = resp
  }

  async function setMainSafe() {
    const resp = await fetchSafe(mainSafeAddress.value)

    mainSafe.value = resp
  }

  async function setMultiSigSafe() {
    const resp = await fetchSafe(multiSigSafeAddress.value)

    multiSigSafe.value = resp
  }

  function checkNetworkIsAuthorised(chainId: string | number) {
    return !!authorisedNetworks.value?.find(i => i.chainId == chainId)
  }

  watch(account, async () => {
    if (!account.value)
      return

    fetchSafes()
  }, {
    immediate: true,
  })

  watch(safeAddress, async () => {
    if (!safeAddress.value)
      return

    setSafe()
  }, {
    immediate: true,
  })

  watch(mainSafeAddress, async () => {
    if (!mainSafeAddress.value)
      return

    setMainSafe()
  }, {
    immediate: true,
  })

  watch(multiSigSafeAddress, async () => {
    if (!multiSigSafeAddress.value)
      return

    setMultiSigSafe()
  }, {
    immediate: true,
  })

  return {
    authorities,
    mainSafe,
    safes,
    selectedSafe,
    setSafe,
    isWalletSecondary,
    authorisedNetworks,
    checkNetworkIsAuthorised,
    multiSigSafe,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
