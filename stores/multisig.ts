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

  watch(selectedSafe, async () => {
    if (!selectedSafe.value)
      return

    getRequiredSigners()
  })

  return {
    isSafeMultisig,
    signers,
    requiredSigners,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMultisig, import.meta.hot))
