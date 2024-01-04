import { serialize } from 'error-serializer'
import { ethers } from 'ethers'
import { getForwarderProxyAddress, getMultisigForwarderProxyAddress } from '~~/utils/avocado'
import { AvoMultisigImplementation__factory, Forwarder__factory, GaslessWallet__factory, MultisigForwarder__factory } from '@/contracts'

const serverRpcInstances = {} as Record<string, ethers.providers.StaticJsonRpcProvider>

export function getServerBatchedRpcProvider(chainId: number | string) {
  if (!serverRpcInstances[chainId]) {
    const network = networks.find(n => n.chainId == chainId)
    serverRpcInstances[chainId] = new ethers.providers.JsonRpcBatchProvider(
      network?.serverRpcUrl,
    )
  }

  return serverRpcInstances[chainId]
}

export async function getSafeOptionsByChain(params: IOptionsParams): Promise<ISafeOptions> {
  const { safe, provider, chainId, server = false, is_prod } = params

  const multisigForwarderProxyAddress = getMultisigForwarderProxyAddress(is_prod)
  const forwarderProxyAddress = getForwarderProxyAddress(is_prod)

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

  function currentVersion(): Promise<string> {
    if (safe.multisig == 1) {
      return implInstance.DOMAIN_SEPARATOR_VERSION().catch(() => {
        obj.notdeployed = true

        return '0.0.0'
      })
    }
    else {
      const gaslessWalletInstance = GaslessWallet__factory.connect(
        safe.safe_address!,
        provider,
      )

      return gaslessWalletInstance.DOMAIN_SEPARATOR_VERSION().catch(() => {
        obj.notdeployed = true

        return '0.0.0'
      })
    }
  }

  function latestVersion(): Promise<string> {
    if (safe.multisig == 1) {
      return multisigForwarderInstance.avocadoVersion(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        safe.multisig_index).catch(() => {
        return '1.0.0'
      })
    }

    return legacyForwarderInstance
      .avoWalletVersion('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
  }

  function domainName(): Promise<string> {
    if (safe.multisig == 1) {
      return implInstance.DOMAIN_SEPARATOR_NAME()
        .catch(() => multisigForwarderInstance.avocadoVersionName(
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          safe.multisig_index,
        ).catch(() => {
          return 'Avocado-Multisig'
        }))
    }

    const gaslessWalletInstance = GaslessWallet__factory.connect(
      safe.safe_address!,
      provider,
    )

    return gaslessWalletInstance.DOMAIN_SEPARATOR_NAME()
      .catch(() =>
        legacyForwarderInstance
          .avoWalletVersionName('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'))
  }

  function nonce(): Promise<number> {
    if (safe.multisig == 1) {
      return multisigForwarderInstance.avoNonce(safe.owner_address, safe.multisig_index)
        .then(nonce => toBN(nonce).toNumber())
        .catch((e) => {
          const parsed = serialize(e)
          if (parsed.code === 'CALL_EXCEPTION')
            return 0

          throw e
        })
    }
    else {
      return legacyForwarderInstance.avoSafeNonce(safe.owner_address).then(nonce => toBN(nonce).toNumber()).catch((e) => {
        const parsed = serialize(e)
        if (parsed.code === 'CALL_EXCEPTION')
          return 0

        throw e
      },
      )
    }
  }

  function threshold(): Promise<number> {
    if (safe.multisig == 0)
      return Promise.resolve(0)

    return implInstance.requiredSigners().catch((e) => {
      const parsed = serialize(e)

      if (parsed.code === 'CALL_EXCEPTION')
        return 1

      throw e
    })
  }

  const [_threshold, _nonce, _latestVersion, _currentVersion, _domainName] = await Promise.all([
    threshold(),
    nonce(),
    latestVersion(),
    currentVersion(),
    domainName(),
  ])

  obj.chainId = chainId
  obj.threshold = _threshold
  obj.nonce = _nonce
  obj.latestVersion = _latestVersion
  obj.currentVersion = _currentVersion
  obj.safeAddress = safe.safe_address
  obj.ownerAddress = safe.owner_address
  obj.server = server
  obj.domainName = _domainName

  return obj
}

export async function getComputedAddresses(params: IComputeSafeParams) {
  const { accountAddress, provider, isProd = true } = params

  const multisigForwarderProxyAddress = getMultisigForwarderProxyAddress(isProd)
  const forwarderProxyAddress = getForwarderProxyAddress(isProd)

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
