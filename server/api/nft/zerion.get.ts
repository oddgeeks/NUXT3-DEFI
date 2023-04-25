import { mixed, object, string } from 'yup'

export default defineEventHandler<NFTData[]>(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    chains: mixed()
      .default([])
      .required()
      .transform((_, originalValue) => Array.isArray(originalValue) ? originalValue : [originalValue]),
  })

  await schema.validate(params)

  const { chains, address } = schema.cast(params)

  const chainNames = availableNetworks.filter(i => chains.includes(String(i.chainId))).map(i => i.zerionName)

  const resp = await $fetch<IZerionNFT>(`https://api.zerion.io/v1/wallets/${address}/nft-positions/?currency=usd&page[size]=100`, {
    params: {
      'filter[chain_ids]': chainNames.join(','),
      'include': 'nft_collections,nfts',
    },
    method: 'GET',
    headers: {
      authorization: 'Basic emtfZGV2X2FhZjBmODU3ODZjYTRlNGZiMGIzZmJmZWMwZTU2ZTE3Og==', // base64Encoded,
    },
  })

  return resp.data.map((i) => {
    const network = availableNetworks.find(n => n.zerionName === i.relationships.chain.data.id)

    return {
      chainId: network?.chainId,
      collectionName: i.attributes.collection_info.name,
      name: i.attributes.nft_info.name,
      imageUrl: i.attributes.collection_info.content.banner.url,
      contractAddress: i.attributes.nft_info.contract_address,
      tokenId: i.attributes.nft_info.token_id,
    } as NFTData
  })
})
