import { acceptHMRUpdate, defineStore } from 'pinia'

export const useAuthorities = defineStore('authorities', () => {
  const { signer, safeAddress, mainSafeAddress, sendTransaction } = useAvocadoSafe()
  const { avoProvider } = useSafe()
  const { account } = useWeb3()

  const safes = ref<ISafe[]>([])
  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()

  const authorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities)
  })

  const isWalletSecondary = computed(() => mainSafe.value?.safe_address !== selectedSafe.value?.safe_address)

  const authorisedNetworks = computed(() => {
    if (!account.value)
      return availableNetworks

    if (!isWalletSecondary.value)
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

  const fetchSafe = async (safeAddress: string) => {
    return avoProvider.send('api_getSafe', [safeAddress])
  }

  async function setSafe() {
    const resp = await fetchSafe(safeAddress.value)

    selectedSafe.value = resp

    console.log({
      selectedSafe: resp,
    })
  }

  async function setMainSafe() {
    const resp = await fetchSafe(mainSafeAddress.value)

    console.log({
      mainSafe: resp,
    })
    mainSafe.value = resp
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

  return {
    authorities,
    mainSafe,
    safes,
    selectedSafe,
    setSafe,
    isWalletSecondary,
    authorisedNetworks,
    checkNetworkIsAuthorised,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
