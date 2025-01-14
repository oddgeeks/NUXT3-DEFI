// Setup provider AnkrProvider

import { isAddress } from '@ethersproject/address'
import * as Yup from 'yup'
import { getServerBatchedRpcProvider } from '@/server/utils/safe'

export default defineEventHandler(async (event) => {
  const chainId = getRouterParam(event, 'chainId')
  const safeAddress = getRouterParam(event, 'safeAddress')

  const query = getQuery(event)

  const schema = Yup.object().shape({
    multisig_index: Yup.number().required(),
    multisig: Yup.number().required(),
    owner_address: Yup.string().required(),
    deployed: Yup.object(),
    is_prod: Yup.boolean(),
  })

  await schema.validate(query)

  const { multisig = 0, multisig_index = 0, owner_address, is_prod = true } = schema.cast(query)

  if (!owner_address) {
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
    safe: {
      multisig,
      multisig_index,
      owner_address,
      safe_address: safeAddress,
    },
    chainId,
    provider,
    server: true,
    is_prod,
  })
})
