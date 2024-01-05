const hiddenNFTs = useLocalStorage<NFTData[]>('hidden-nfts', [])
const hideNFT = useLocalStorage<boolean>('hide-nft', false)

export function useNft() {
  class NFT {
    owner: string

    constructor(owner: string) {
      this.owner = owner
    }

    async getNFTs(): Promise<NFTData[]> {
      const resp = await Promise.allSettled([
        this.fetchAlchemyNFTData([1, 137, 10, 42161]),
        this.fetchAnkrNFTData([56, 43114, 250]),
        // this.fetchZerionNFTData([100], params),
      ])

      return resp.reduce((acc, i) => {
        if (i.status === 'fulfilled' && i.value)
          acc.push(...i.value)

        else if (i.status === 'rejected')
          console.error(i.reason)

        return acc
      }, [] as NFTData[])
    }

    private async fetchAlchemyNFTData(
      chainIds: number[],
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
    ): Promise<NFTData[]> {
      return http('/api/nft/ankr', {
        params: {
          address: this.owner,
          chains: chainIds,
        },
      })
    }
  }

  function isNFTHidden(asset: NFTData) {
    const index = hiddenNFTs.value.findIndex(nft => nft.contractAddress.toLowerCase() === asset.contractAddress.toLowerCase() && nft.tokenId === asset.tokenId)

    return {
      hidden: index !== -1,
      index,
    }
  }

  return {
    NFT,
    isNFTHidden,
    hiddenNFTs,
    hideNFT,
  }
}
