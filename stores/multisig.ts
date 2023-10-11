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

  function checkHasInstadappSigner(safe: ISafe) {
    const signers = formatSigners(safe.signers)

    const instadappSigners = signers.find(i => getAddress(i.address) === getAddress(instadappSigner))

    if (!instadappSigners)
      return false

    return instadappSigners.chainIds.length > 0
  }

  const instadappSignerNetworks = computed(() => {
    const instadappSigners = signers.value.find(i => getAddress(i.address) === getAddress(instadappSigner))

    if (!instadappSigners)
      return []

    return instadappSigners.chainIds.map(i => getNetworkByChainId(i))
  })

  const backupSigners = computed(() => {
    return signers.value.filter(i => !isAddressEqual(i.address, instadappSigner) && !isAddressEqual(i.address, selectedSafe.value?.owner_address))
  })

  const hasInstadappSigner = computed(() => checkHasInstadappSigner(selectedSafe.value!))

  function isSignerAdded(address: string, chainId: number | string) {
    const signers = selectedSafe.value?.signers?.[chainId] || []
    return signers.some(i => getAddress(i) === getAddress(address))
  }

  function isInstadappSignerAdded(chainId: number | string) {
    return isSignerAdded(instadappSigner, chainId)
  }

  function checkAtleastOneMfaVerified(safe: ISafe) {
    return safe.mfa_phone_verified === 1 || safe.mfa_email_verified === 1 || safe.mfa_totp_verified === 1
  }

  function checkSafeIsActualMultisig(safe: ISafe) {
    if (!safe)
      return false

    if (safe?.multisig_index > 0)
      return true

    if (checkAtleastOneMfaVerified(safe) || hasInstadappSigner.value)
      return false

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
    backupSigners,
    requiredSigners,
    getRequiredSigner,
    isAccountCanSign,
    checkSafeIsActualMultisig,
    hasInstadappSigner,
    isSignerAdded,
    instadappSignerNetworks,
    isInstadappSignerAdded,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMultisig, import.meta.hot))
