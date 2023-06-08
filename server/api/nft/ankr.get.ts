import { AnkrProvider } from '@ankr.com/ankr.js'
import { mixed, object, string } from 'yup'

export default defineEventHandler<NFTData[]>(async (event) => {
  const { ankrApiKey } = useRuntimeConfig()
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

  if (!address) {
    createError({
      message: 'Address is required',
      statusCode: 400,
    })
  }

  const provider = new AnkrProvider(ankrApiKey)

  const ankrChains = availableNetworks
    .filter(i => i.ankrName && chains.includes(String(i.chainId)))
    .map(i => i.ankrName)

  console.log('ankrChains: ', ankrChains)

  const nfts = await provider.getNFTsByOwner({
    walletAddress: address as string,
    pageSize: params.pageSize as number,
    blockchain: ankrChains as any,
  })

  return nfts.assets.reduce((acc, nft) => {
    const network = availableNetworks.find(
      i => i.ankrName === nft.blockchain,
    )
    if (!network)
      return acc

    acc.push({
      imageUrl: nft.imageUrl,
      collectionName: nft.collectionName,
      name: nft.name,
      chainId: network.chainId,
      tokenId: nft.tokenId,
      contractAddress: nft.contractAddress,
      contractType: nft.contractType,
      thumbnailUrl: nft.imageUrl,
      attributes: nft.traits?.map(i => ({ type: i.trait_type, value: i.value })) as NFTAttributes[] || [],
    })

    return acc
  }, [] as NFTData[])
})
