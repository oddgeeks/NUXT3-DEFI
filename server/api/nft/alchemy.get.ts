import type { Network } from 'alchemy-sdk'
import { Alchemy } from 'alchemy-sdk'
import { mixed, object, string } from 'yup'

export default defineEventHandler<NFTData[]>(async (event) => {
  const networks = {
    1: 'eth-mainnet',
    137: 'polygon-mainnet',
    10: 'opt-mainnet',
    42161: 'arb-mainnet',
  } as Record<string, Network>

  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    chains: mixed<string[]>()
      .default([])
      .required()
      .transform((_, originalValue) => Array.isArray(originalValue) ? originalValue : [originalValue]),
  })
  await schema.validate(params)

  const { chains, address } = schema.cast(params)

  const alchemyChains = chains
    .filter(i => networks[i])
    .map(i => networks[i])

  const resp = await Promise.all(
    alchemyChains.map(async (chain) => {
      const settings = {
        apiKey: 'rjZZvrH1nWK_nE4dwdgONdfkXL7vJF90',
        network: chain,
      }

      const provider = new Alchemy(settings)
      const resp = await provider.nft.getNftsForOwner(address!, params)

      return resp.ownedNfts.map((i) => {
        const chainId = Object.keys(networks).find(
          (key: any) => networks[key] === chain,
        ) as any

        const attributes = Array.isArray(i.rawMetadata?.attributes) ? i.rawMetadata?.attributes : []

        return {
          chainId,
          collectionName: i.contract.name,
          imageUrl: i.media[0]?.gateway,
          thumbnailUrl: i.media[0]?.thumbnail,
          name: i.title,
          tokenId: i.tokenId,
          contractAddress: i.contract.address,
          contractType: i.contract.tokenType,
          attributes: attributes?.map(i => ({ type: i.trait_type, value: i.value })) as NFTAttributes[] || [],
        } as NFTData
      })
    }),
  )

  return resp.flat()
})
