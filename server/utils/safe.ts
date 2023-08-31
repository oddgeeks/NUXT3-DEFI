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

export async function getSafeOptionsByChain(safe: ISafe, chainId: string | number, provider: ethers.providers.StaticJsonRpcProvider, server = false): Promise<ISafeOptions> {
  const obj = {} as ISafeOptions

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
    return multisigForwarderInstance.avoNonce(safe.owner_address, safe.multisig_index).then(nonce => toBN(nonce).toNumber())
  }

  function threshold(): Promise<number> {
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
  obj.server = server

  return obj
}

export async function getComputedAddresses(provider: ethers.providers.StaticJsonRpcProvider, accountAddress: string) {
  const legacyProvider = Forwarder__factory.connect(
    forwarderProxyAddress,
    provider,
  )

  const multisigProvider = MultisigForwarder__factory.connect(
    multisigForwarderProxyAddress,
    provider,
  )

  const [oldSafeAddress, address, multisigAddress] = await Promise.all(
    [
      legacyProvider.computeAddress(
        accountAddress,
      ),
      multisigProvider.computeAvocado(
        accountAddress,
        0,
      ),
      multisigProvider.computeAvocado(
        accountAddress,
        1,
      ),
    ],
  )

  return {
    oldSafeAddress,
    address,
    multisigAddress,
  }
}
