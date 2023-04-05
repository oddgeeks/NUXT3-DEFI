import { AnkrProvider } from "@ankr.com/ankr.js";

export const useNft = () => {
  class NFT {
    userAddress: string;

    constructor(userAddress: string) {
      this.userAddress = userAddress;
    }

    async getNFTs(): Promise<NFTData[]> {
      return this.fetchAnkrNFTData();
    }

    private async fetchAnkrNFTData(): Promise<NFTData[]> {
      const provider = new AnkrProvider();

      const nfts = await provider.getNFTsByOwner({
        walletAddress: this.userAddress,
        pageSize: 50,
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
