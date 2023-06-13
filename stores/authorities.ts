import { acceptHMRUpdate, defineStore } from 'pinia'
import { AvoSafeImplementation__factory } from '~~/contracts'

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

  const deleteAuthority = async (authority: IAuthority) => {
    try {
      const instance = AvoSafeImplementation__factory.connect(safeAddress.value, signer.value!)
      const resp = await instance.populateTransaction.addAuthorities([authority.address])

      const tx = await sendTransaction({
        to: safeAddress.value,
        data: resp.data,
        value: '0',
        operation: '0',
        chainId: 137, //
      })

      console.log(tx)
    }
    catch (e) {
      console.log(e)
    }
  }

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
  }

  async function setMainSafe() {
    const resp = await fetchSafe(mainSafeAddress.value)
    mainSafe.value = resp
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
    deleteAuthority,
    authorities,
    mainSafe,
    safes,
    selectedSafe,
    setSafe,
    isWalletSecondary,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
