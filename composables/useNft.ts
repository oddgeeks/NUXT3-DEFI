import { AnkrProvider } from '@ankr.com/ankr.js'

export function useNft() {
  class NFT {
    owner: string

    constructor(owner: string) {
      this.owner = owner
    }

    async getNFTs(params: NFTParams): Promise<NFTData[]> {
      const resp = await Promise.allSettled([
        this.fetchAlchemyNFTData([1, 137, 10, 42161], params),
        this.fetchAnkrNFTData([56, 43114, 250], params),
        // this.fetchZerionNFTData([100], params),
      ])

      return resp.reduce((acc, i) => {
        if (i.status === 'fulfilled' && i.value)
          acc.push(...i.value)

        else if (i.status === 'rejected')
          console.error(i.reason)

        return acc
      }
      , [] as NFTData[])
    }

    private async fetchAlchemyNFTData(
      chainIds: number[],
      params: NFTParams,
    ): Promise<NFTData[]> {
      return http('/api/nft/alchemy', {
        params: {
          address: this.owner,
          chains: chainIds,
        },
      })
    }

    private async fetchZerionNFTData(
      chainIds: number[],
      params: NFTParams,
    ): Promise<NFTData[]> {
      return http('/api/nft/zerion', {
        params: {
          address: this.owner,
          chains: chainIds,
        },
      })
    }

    private async fetchAnkrNFTData(
      chainIds: number[],
      params: NFTParams,
    ): Promise<NFTData[]> {
      const provider = new AnkrProvider()

      const ankrChains = availableNetworks
        .filter(i => i.ankrName && chainIds.includes(i.chainId))
        .map(i => i.ankrName)

      console.log('ankrChains: ', ankrChains)

      const nfts = await provider.getNFTsByOwner({
        walletAddress: this.owner,
        pageSize: params.pageSize,
        blockchain: ankrChains as any,
      })
      console.log('nfts: ', nfts)

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
        })

        return acc
      }, [] as NFTData[])
    }
  }

  return {
    NFT,
  }
}
