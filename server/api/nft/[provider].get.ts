import { Alchemy, Network } from "alchemy-sdk";

export default defineEventHandler((event) => {
  const query = getQuery(event);

  const provider = new Alchemy({
    apiKey: "rjZZvrH1nWK_nE4dwdgONdfkXL7vJF90",
    network: Network.ETH_MAINNET,
  });
  return provider.nft.getNftsForOwner(query.owner as string, {
    pageSize: query.pageSize as number,
  });
});
