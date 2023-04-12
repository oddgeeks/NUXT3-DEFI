import {
  getEtherTransfersFromEtherscan,
  getTokenTransfersFromEtherscan,
} from "../utils/etherscan";
import { getTokenTransfersFromAnkr } from "../utils/ankr";

const GNOSIS_CHAIN_ID = 100;

interface AssetTransferCount {
  totalTransfers: number;
}

export default defineEventHandler<AssetTransferCount>(async (event) => {
  let query = getQuery(event);

  const from = String(query.from);
  const to = String(query.to);
  const chainId = query.chainId ? Number(query.chainId) : undefined;

  let totalTransfers = 0;

  if (chainId) {
    if (chainId === GNOSIS_CHAIN_ID) {
      totalTransfers = await getTokenTransfersFromEtherscan(
        from,
        to,
        GNOSIS_CHAIN_ID
      );
    } else {
      totalTransfers = await getTokenTransfersFromAnkr(from, to, chainId);
    }
  } else {
    const transfers = await Promise.all([
      getTokenTransfersFromAnkr(from, to, undefined),
      getTokenTransfersFromEtherscan(from, to, GNOSIS_CHAIN_ID),
    ]);
    totalTransfers = transfers[0] + transfers[1];
  }

  const networks = chainId
    ? [chainId]
    : availableNetworks.map((network) => Number(network.chainId));

  const etherTransfers = await Promise.all(
    networks.map((networkId) =>
      getEtherTransfersFromEtherscan(from, to, networkId)
    )
  );

  for (const transfer of etherTransfers) {
    totalTransfers += transfer;
  }

  return {
    totalTransfers,
  };
});
