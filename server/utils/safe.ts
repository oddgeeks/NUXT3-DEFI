import { MultisigForwarder__factory } from '@instadapp/avocado-base/contracts'
import { serialize } from 'error-serializer'
import type { ethers } from 'ethers'
import { forwarderProxyAddress, multisigForwarderProxyAddress } from '@/utils/avocado'
import { AvoMultisigImplementation__factory, Forwarder__factory, GaslessWallet__factory } from '@/contracts'

interface ISafe {
  safe_address: string
  multisig_index: number
  multisig: number
  owner_address: string
  deployed: Record<string, boolean>
}

export async function getSafeOptionsByChain(safe: ISafe, chainId: string | number, provider: ethers.providers.StaticJsonRpcProvider): Promise<ISafeOptions> {
  const obj = {} as ISafeOptions

  const deployedChains = safe?.deployed || {}
  const deployed = !!deployedChains[chainId]

  const implInstance = AvoMultisigImplementation__factory.connect(safe.safe_address, provider)

  const multisigForwarderInstance = MultisigForwarder__factory.connect(
    multisigForwarderProxyAddress,
    provider,
  )

  const legacyForwarderInstance = Forwarder__factory.connect(
    forwarderProxyAddress,
    provider,
  )

  const gaslessWalletInstance = GaslessWallet__factory.connect(
    safe.safe_address!,
    provider,
  )

  function currentVersion(): Promise<string> {
    if (!deployed)
      return new Promise (resolve => resolve('0.0.0'))
    return gaslessWalletInstance.DOMAIN_SEPARATOR_VERSION()
  }

  function latestVersion(): Promise<string> {
    if (safe.multisig === 1)
      return multisigForwarderInstance.avocadoVersion('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', safe.multisig_index)

    return legacyForwarderInstance.avoWalletVersion(
      '0x0000000000000000000000000000000000000001',
    )
  }

  function nonce(): Promise<number> {
    if (!deployed)
      return new Promise (resolve => resolve(0))
    return multisigForwarderInstance.avoNonce(safe.owner_address, safe.multisig_index).then(nonce => toBN(nonce).toNumber())
  }

  function threshold(): Promise<number> {
    if (!deployed)
      return new Promise(resolve => resolve(1))
    return implInstance.requiredSigners()
  }

  const [_threshold, _nonce, _latestVersion, _currentVersion] = await Promise.all([
    threshold()
      .catch((e) => {
        const parsed = serialize(e)

        if (parsed.code === 'CALL_EXCEPTION')
          return 1

        throw e
      }),
    nonce().catch((e) => {
      const parsed = serialize(e)
      if (parsed.code === 'CALL_EXCEPTION')
        return 0

      throw e
    }),
    latestVersion()
      .catch((e) => {
        const parsed = serialize(e)
        if (parsed.code === 'CALL_EXCEPTION') {
          obj.notdeployed = true
          return '0.0.0'
        }

        throw e
      }),
    currentVersion()
      .catch((e) => {
        const parsed = serialize(e)

        if (parsed.code === 'CALL_EXCEPTION') {
          obj.notdeployed = true
          return '0.0.0'
        }

        throw e
      }),
  ])

  obj.chainId = chainId
  obj.threshold = _threshold
  obj.nonce = _nonce
  obj.latestVersion = _latestVersion
  obj.currentVersion = _currentVersion
  obj.safeAddress = safe.safe_address
  obj.ownerAddress = safe.owner_address

  return obj
}
