import { AnkrProvider } from "@ankr.com/ankr.js";

export const useNft = () => {
  class NFT {
    owner: string;

    constructor(owner: string) {
      this.owner = owner;
    }

    async getNFTs(params: NFTParams): Promise<NFTData[]> {
      return this.fetchAnkrNFTData([1, 56, 137], params);
    }

    // private async fetchAlchemyNFTData(chainIds: number[], params: NFTParams): Promise<NFTData[]> {
    // }

    private async fetchAnkrNFTData(
      chainIds: number[],
      params: NFTParams
    ): Promise<NFTData[]> {
      const provider = new AnkrProvider();

      const nfts = await provider.getNFTsByOwner({
        walletAddress: this.owner,
        pageSize: params.pageSize,
      });

      return nfts.assets.reduce((acc, nft) => {
        const chainId = nameToChainId(nft.blockchain);
        if (!chainId) return acc;

        acc.push({
          imageUrl: nft.imageUrl,
          collectionName: nft.collectionName,
          name: nft.name,
          chainId: chainId as number,
        });

        return acc;
      }, [] as NFTData[]);
    }
  }

  return {
    NFT,
  };
};
