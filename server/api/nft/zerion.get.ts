import { array, object, string } from 'yup'

export default defineEventHandler<NFTData[]>(async (event) => {
  const params = getQuery(event)

  const schema = object().shape({
    address: string().required(),
    chains: array().default([]).min(1).required(),
  })

  // const username = 'certel@hotmail.com'
  // const password = 'zk_dev_aaf0f85786ca4e4fb0b3fbfec0e56e17'

  // // Combine the username and password with a colon separator
  // const combined = `${username}:${password}`

  // // Convert the combined string to base64
  // const base64Encoded = Buffer.from(combined).toString('base64')

  // console.log(base64Encoded)

  await schema.validate(params)

  const { chains, address } = schema.cast(params)

  const chainNames = availableNetworks.filter(i => chains.includes(String(i.chainId))).map(i => i.zerionName)

  const resp = await $fetch<IZerionNFT>(`https://api.zerion.io/v1/wallets/${address}/nft-positions/?currency=usd&page[size]=100`, {
    params: {
      'filter[chain_ids]': chainNames.join(','),
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
