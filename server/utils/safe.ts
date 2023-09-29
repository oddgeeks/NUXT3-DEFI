import { serialize } from 'error-serializer'
import { ethers } from 'ethers'
import { AVO_PROD_MULTISIG_FORWARDER_ADDR, AVO_STAGING_MULTISIG_FORWARDER_ADDR } from '../../utils/avocado'
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
  const { safe, provider, chainId, server = false } = params
  const { _forwarderProxyAddress, _multisigForwarderProxyAddress } = getContractAddresses()

  const obj = {} as ISafeOptions

  const implInstance = AvoMultisigImplementation__factory.connect(safe.safe_address, provider)

  const multisigForwarderInstance = MultisigForwarder__factory.connect(
    _multisigForwarderProxyAddress,
    provider,
  )

  const legacyForwarderInstance = Forwarder__factory.connect(
    _forwarderProxyAddress,
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
      return implInstance.DOMAIN_SEPARATOR_VERSION().catch(() => {
        obj.notdeployed = true

        return multisigForwarderInstance.avocadoVersion(
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
          safe.multisig_index).catch(() => {
          return '1.0.0'
        })
      })
    }

    return legacyForwarderInstance.avoWalletVersion(
      '0x0000000000000000000000000000000000000001',
    ).catch(() => {
      obj.notdeployed = true

      return '0.0.0'
    })
  }

  function domainName(): Promise<string> {
    return implInstance.DOMAIN_SEPARATOR_NAME()
      .catch(() => multisigForwarderInstance.avocadoVersionName(
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        safe.multisig_index,
      ).catch(() => {
        return 'Avocado-Multisig'
      }))
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

function getContractAddresses() {
  const config = useAppConfig()

  const multisigForwarderProxyAddress = config.isProd
    ? AVO_PROD_MULTISIG_FORWARDER_ADDR
    : AVO_STAGING_MULTISIG_FORWARDER_ADDR

  const forwarderProxyAddress = config.isProd
    ? AVO_PROD_FORWARDER_ADDR
    : AVO_STAGING_FORWARDER_ADDR

  return {
    _multisigForwarderProxyAddress: multisigForwarderProxyAddress,
    _forwarderProxyAddress: forwarderProxyAddress,
  }
}

export async function getComputedAddresses(params: IComputeSafeParams) {
  const { accountAddress, provider } = params

  const { _forwarderProxyAddress, _multisigForwarderProxyAddress } = getContractAddresses()

  const legacyProvider = Forwarder__factory.connect(
    _forwarderProxyAddress,
    provider,
  )

  const multisigProvider = MultisigForwarder__factory.connect(
    _multisigForwarderProxyAddress,
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
