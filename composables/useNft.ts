import { AnkrProvider } from "@ankr.com/ankr.js";

export const useNft = () => {
  class NFT {
    owner: string;

    constructor(owner: string) {
      this.owner = owner;
    }

    async getNFTs(params: NFTParams): Promise<NFTData[]> {
      return Promise.all([
        this.fetchAnkrNFTData([56], params),
        this.fetchAlchemyNFTData([1, 137, 10, 42161], params),
      ]).then((res) => res.flat());
    }

    private async fetchAlchemyNFTData(
      chainIds: number[],
      params: NFTParams
    ): Promise<NFTData[]> {
      return http("/api/nft/achemist", {
        params: {
          address: this.owner,
          chains: chainIds,
        },
      });
    }

    private async fetchAnkrNFTData(
      chainIds: number[],
      params: NFTParams
    ): Promise<NFTData[]> {
      const provider = new AnkrProvider();

      const ankrChains = availableNetworks
        .filter((i) => i.ankrName && chainIds.includes(i.chainId))
        .map((i) => i.ankrName);

      const nfts = await provider.getNFTsByOwner({
        walletAddress: this.owner,
        pageSize: params.pageSize,
        blockchain: ankrChains as any,
      });

      return nfts.assets.reduce((acc, nft) => {
        const network = availableNetworks.find(
          (i) => i.ankrName === nft.blockchain
        );
        if (!network) return acc;

        acc.push({
          imageUrl: nft.imageUrl,
          collectionName: nft.collectionName,
          name: nft.name,
          chainId: network.chainId,
          tokenId: nft.tokenId,
        });

        return acc;
      }, [] as NFTData[]);
    }
  }

  return {
    NFT,
  };
};
