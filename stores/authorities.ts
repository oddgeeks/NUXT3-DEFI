import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { getAddress } from 'ethers/lib/utils'
import {
  AvoMultisigImplementation__factory,
} from '@/contracts'

export const useAuthorities = defineStore('authorities', () => {
  const avoProvider = getRpcProvider(avoChainId)

  const safes = ref<ISafe[]>([])
  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()
  const multiSigSafe = ref<ISafe>()
  const requiredSigners = ref<IRequiredSigners[]>([])

  const { safeAddress, mainSafeAddress, multiSigSafeAddress } = storeToRefs(useSafe())
  const { account } = useWeb3()

  const authorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities)
  })

  const signers = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatSigners(selectedSafe.value.signers)
  })

  const isSafeMultisig = computed(() => selectedSafe.value?.multisig === 1)

  const isWalletSecondary = computed(() => selectedSafe.value?.multisig !== 1 && (mainSafe.value?.safe_address !== selectedSafe.value?.safe_address))

  const authorisedNetworks = computed(() => {
    if (!account.value || !safeAddress?.value || !isWalletSecondary.value)
      return availableNetworks

    const auth = authorities.value.find(i => i.address === account.value)

    return auth?.chainIds.map(i => getNetworkByChainId(i))
  })

  const fetchSafes = async () => {
    const resp = await avoProvider.send('api_getSafes', [{
      address: account.value,
    }])

    safes.value = resp?.data || []
  }

  const fetchSafe = async (address: string) => {
    return avoProvider.send('api_getSafe', [address])
  }

  async function setSafe() {
    const resp = await fetchSafe(safeAddress.value)

    if (!resp) {
      const isMultiSafe = getAddress(safeAddress.value) === getAddress(multiSigSafeAddress.value)
      selectedSafe.value = getDefaultSafe(safeAddress.value, isMultiSafe ? 1 : 0)
    }
    else {
      selectedSafe.value = resp
    }
  }

  async function setMainSafe() {
    const resp = await fetchSafe(mainSafeAddress.value)

    mainSafe.value = resp
  }

  async function setMultiSigSafe() {
    try {
      const resp = await fetchSafe(multiSigSafeAddress.value)

      if (!resp)
        multiSigSafe.value = getDefaultSafe(multiSigSafeAddress.value, 1)
      else
        multiSigSafe.value = resp
    }
    catch (e) {
    }
  }

  function checkNetworkIsAuthorised(chainId: string | number) {
    return !!authorisedNetworks.value?.find(i => i.chainId == chainId)
  }

  function getDefaultSafe(address: string, multisig: 0 | 1 = 0): ISafe {
    return {
      safe_address: address,
      authorities: {},
      created_at: new Date().toString(),
      deployed: {},
      fully_deployed: 0,
      id: 0,
      owner_address: account.value,
      updated_at: new Date().toString(),
      version: {},
      multisig,
      signers: {},
    }
  }

  async function getRequiredSigners() {
    const requiredSignersArr: IRequiredSigners[] = []
    requiredSigners.value = []

    for (const network of availableNetworks) {
      try {
        const instance = AvoMultisigImplementation__factory.connect(selectedSafe.value?.safe_address!, getRpcProvider(network.chainId))
        const count = await instance.requiredSigners()
        const signers = selectedSafe.value?.signers[network.chainId] || []
        const obj = {
          chainId: network.chainId,
          requiredSignerCount: count,
          signerCount: signers.length,
        }

        requiredSigners.value.push(obj)
        requiredSignersArr.push(obj)
      }
      catch (e) {
        continue
      }
    }

    requiredSigners.value = requiredSignersArr
  }

  watch(account, async () => {
    if (!account.value)
      return

    fetchSafes()
  }, {
    immediate: true,
  })

  watch([safeAddress, multiSigSafeAddress], async () => {
    if (!safeAddress.value || !multiSigSafeAddress.value)
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

    await setMultiSigSafe()
  }, {
    immediate: true,
  })

  watch(selectedSafe, async () => {
    if (!selectedSafe.value)
      return

    getRequiredSigners()
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
    isSafeMultisig,
    signers,
    requiredSigners,
    getDefaultSafe,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
