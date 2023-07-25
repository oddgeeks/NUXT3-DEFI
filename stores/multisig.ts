import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
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

  async function getRequiredSigners(safe: ISafe) {
    const requiredSignersArr: IRequiredSigners[] = []

    for (const network of availableNetworks) {
      try {
        const count = await getRequiredSigner(safe.safe_address, network.chainId)
        const signers = safe?.signers[network.chainId] || []

        const obj = {
          chainId: network.chainId,
          requiredSignerCount: count,
          signerCount: signers.length,
          signers,
        }

        requiredSignersArr.push(obj)
      }
      catch (e) {
        continue
      }
    }

    return requiredSignersArr
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
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMultisig, import.meta.hot))
