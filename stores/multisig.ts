import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { getAddress } from 'ethers/lib/utils'
import {
  AvoMultisigImplementation__factory,
} from '@/contracts'

export const useMultisig = defineStore('multisig', () => {
  const requiredSigners = ref<IRequiredSigners[]>([])

  const { selectedSafe } = storeToRefs(useSafe())

  const signers = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatSigners(selectedSafe.value.signers)
  })

  const isSafeMultisig = computed(() => selectedSafe.value?.multisig === 1)

  function isAccountCanSign(chainId: number | string, account?: string, multisigOwner?: string) {
    if (!account || !multisigOwner || !chainId || !requiredSigners.value?.length)
      return

    const signers = requiredSigners.value.find(s => s.chainId == chainId)?.signers || []

    if (getAddress(multisigOwner) === getAddress(account))
      return true

    return signers.some(s => getAddress(s) === getAddress(account))
  }

  async function getRequiredSigners(safe: ISafe) {
    const promises = availableNetworks.map(async (network) => {
      if (!safe?.signers)
        return []

      const safeSigners = safe?.signers[network.chainId] || []

      const signers = safeSigners.length ? safeSigners : [safe.owner_address]

      try {
        const count = await getRequiredSigner(safe.safe_address, network.chainId)

        return {
          chainId: network.chainId,
          requiredSignerCount: count || 1,
          signerCount: signers.length,
          signers,
        }
      }
      catch (e) {
        return {
          chainId: network.chainId,
          requiredSignerCount: 1,
          signerCount: signers.length,
          signers,
        }
      }
    })

    const results = await Promise.all(promises)

    return results.filter(r => r !== null) as IRequiredSigners[]
  }

  async function getRequiredSigner(safeAddress: string, chainId: number | string) {
    const instance = AvoMultisigImplementation__factory.connect(safeAddress, getRpcProvider(chainId))
    return instance.requiredSigners()
  }

  async function setRequiredSigners() {
    if (!selectedSafe.value)
      return
    const signers = await getRequiredSigners(selectedSafe.value)
    requiredSigners.value = signers
  }

  watch(selectedSafe, async () => {
    if (!selectedSafe.value)
      return

    setRequiredSigners()
  })

  return {
    isSafeMultisig,
    signers,
    requiredSigners,
    getRequiredSigners,
    setRequiredSigners,
    getRequiredSigner,
    isAccountCanSign,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMultisig, import.meta.hot))
