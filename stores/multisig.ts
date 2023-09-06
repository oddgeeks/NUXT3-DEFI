import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { getAddress } from 'ethers/lib/utils'
import type { Provider } from '@ethersproject/providers'
import { serialize } from 'error-serializer'
import { AvoMultisigImplementation__factory } from '@/contracts'

export const useMultisig = defineStore('multisig', () => {
  const requiredSigners = ref<IRequiredSigners[]>([])

  const { selectedSafe } = storeToRefs(useSafe())
  const { getRpcProviderByChainId } = useShared()

  const signers = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatSigners(selectedSafe.value.signers)
  })

  const isSafeMultisig = computed(() => checkSafeIsActualMultisig(selectedSafe.value!))

  function isAccountCanSign(chainId: number | string, account?: string, multisigOwner?: string) {
    if (!account || !multisigOwner || !chainId)
      return

    const signers = selectedSafe.value?.signers?.[chainId] || []

    if (getAddress(multisigOwner) === getAddress(account))
      return true

    return signers.some(s => getAddress(s) === getAddress(account))
  }

  async function getRequiredSigner(safeAddress: string, chainId: number | string) {
    const publicProvider = getRpcProviderByChainId(chainId)

    try {
      const requiredSigner = await getRequiredSignerByProvider(safeAddress, publicProvider)
      return requiredSigner
    }
    catch (e) {
      const error = serialize(e)

      // return default if the multisig is not deployed
      if (error?.code === 'CALL_EXCEPTION')
        return 1

      const requiredSigner = await http('/api/rpc/threshold', {
        params: {
          address: safeAddress,
          chainId: String(chainId),
        },
      })

      return requiredSigner
    }
  }

  async function getRequiredSignerByProvider(address: string, provider: Provider) {
    const instance = AvoMultisigImplementation__factory.connect(address, provider)
    const requiredSigner = await instance.requiredSigners()
    return requiredSigner
  }

  function checkSafeIsActualMultisig(safe: ISafe) {
    if (!safe)
      return false

    if (safe?.multisig_index > 0)
      return true

    const signers = safe?.signers || {}

    const hasSomeSigner = Object.keys(signers).some((chainId) => {
      const chainSigners = signers[chainId]

      return chainSigners.length > 1
    })

    return safe.multisig === 1 && hasSomeSigner
  }

  return {
    isSafeMultisig,
    signers,
    requiredSigners,
    getRequiredSigner,
    isAccountCanSign,
    checkSafeIsActualMultisig,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMultisig, import.meta.hot))