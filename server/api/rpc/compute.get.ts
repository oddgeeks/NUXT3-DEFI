import { ethers } from 'ethers'
import { object, string } from 'yup'

const serverRpcInstances = {} as Record<string, ethers.providers.StaticJsonRpcProvider>

function getServerBatchedRpcProvider(chainId: number | string) {
  if (!serverRpcInstances[chainId]) {
    const network = networks.find(n => n.chainId == chainId)
    serverRpcInstances[chainId] = new ethers.providers.JsonRpcBatchProvider(
      network?.serverRpcUrl,
    )
  }

  return serverRpcInstances[chainId]
}

export default defineEventHandler(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
  })

  await schema.validate(params)

  const { address } = schema.cast(params)

  if (!address) {
    return createError({
      message: 'Address is required',
      statusCode: 500,
    })
  }

  const provider = getServerBatchedRpcProvider(137)

  return getComputedAddresses(provider, address)
})
