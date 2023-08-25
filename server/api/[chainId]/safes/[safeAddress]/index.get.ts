// Setup provider AnkrProvider

import type { ethers } from 'ethers'
import { isAddress } from 'ethers/lib/utils'
import * as Yup from 'yup'

const serverRpcInstances = {} as Record<string, ethers.providers.StaticJsonRpcProvider>

function getServerBatchedRpcProvider(chainId: number | string) {
  if (!serverRpcInstances[chainId]) {
    const network = networks.find(n => n.chainId == chainId)
    serverRpcInstances[chainId] = new StaticJsonRpcBatchProvider(
      network?.serverRpcUrl,
    )
  }

  return serverRpcInstances[chainId]
}

export default defineEventHandler(async (event) => {
  const chainId = getRouterParam(event, 'chainId')
  const safeAddress = getRouterParam(event, 'safeAddress')

  const query = getQuery(event)

  const schema = Yup.object().shape({
    multisig_index: Yup.number().required(),
    multisig: Yup.number().required(),
    owner_address: Yup.string().required(),
    deployed: Yup.object(),
  })

  await schema.validate(query)

  const { multisig, multisig_index = 0, owner_address, deployed = {} } = schema.cast(query)

  if (!multisig || !owner_address) {
    return createError({
      message: 'Failed to parse query',
      statusCode: 500,
    })
  }

  if (!safeAddress) {
    return createError({
      message: 'Safe address is required',
      statusCode: 500,
    })
  }

  if (!chainId) {
    return createError({
      message: 'Chain ID is required',
      statusCode: 500,
    })
  }

  if (!isAddress(safeAddress)) {
    return createError({
      message: 'Invalid safe address',
      statusCode: 500,
    })
  }

  const provider = getServerBatchedRpcProvider(chainId)

  return getSafeOptionsByChain({
    multisig,
    multisig_index,
    owner_address,
    safe_address: safeAddress,
    deployed,
  }, chainId, provider)
})
