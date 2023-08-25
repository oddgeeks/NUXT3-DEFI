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
}

export async function getSafeOptionsByChain(safe: ISafe, chainId: string | number, provider: ethers.providers.StaticJsonRpcProvider): Promise<ISafeOptions> {
  const obj = {} as ISafeOptions

  console.log(chainId)

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

  function currentVersion() {
    return gaslessWalletInstance.DOMAIN_SEPARATOR_VERSION()
  }

  function latestVersion() {
    if (safe.multisig === 1)
      return multisigForwarderInstance.avocadoVersion('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', safe.multisig_index)

    return legacyForwarderInstance.avoWalletVersion(
      '0x0000000000000000000000000000000000000001',
    )
  }

  function nonce() {
    return multisigForwarderInstance.avoNonce(safe.owner_address, safe.multisig_index).then(nonce => toBN(nonce).toNumber())
  }

  function threshold() {
    return implInstance.requiredSigners()
  }

  const [_threshold, _nonce, _latestVersion, _currentVersion] = await Promise.all([
    threshold()
      .then((e) => {
        console.log('threshold: ', e)
        return e
      })
      .catch((e) => {
        const parsed = serialize(e)

        if (parsed.code === 'CALL_EXCEPTION')
          return 1

        console.log('Error getting threshold: ', parsed)

        throw e
      }),
    nonce()
      .then((e) => {
        console.log('nonce: ', e)
        return e
      }).catch((e) => {
        const parsed = serialize(e)
        if (parsed.code === 'CALL_EXCEPTION')
          return 0

        console.log('Error getting nonce: ', parsed)

        throw e
      }),
    latestVersion()
      .then((e) => {
        console.log('latestVersion: ', e)

        return e
      })
      .catch((e) => {
        const parsed = serialize(e)
        if (parsed.code === 'CALL_EXCEPTION') {
          obj.notdeployed = true
          return '0.0.0'
        }

        console.log('Error getting latest version: ', parsed)

        throw e
      }),
    currentVersion().then((version) => {
      console.log('currentVersion: ', version)
      return version
    })
      .catch((e) => {
        const parsed = serialize(e)

        if (parsed.code === 'CALL_EXCEPTION') {
          obj.notdeployed = true
          return '0.0.0'
        }

        console.log('Error getting current version: ', parsed)

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
