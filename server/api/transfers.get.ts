import {
  getEtherTransfersByEtherscan,
  getTokenTransfersByEtherscan,
} from "../utils/etherscan";
import {
  getMultipleTokenTransfersByAnkr,
  ANKR_API_UNSPPORTED_CHAINS,
} from "../utils/ankr";

interface AssetTransferCount {
  from: string;
  to: string;
  chainId: number;
  transferCount: number;
}

export const getTokenTransfersOnAllChain = async (
  from: string,
  to: string[]
): Promise<Record<string, number>> => {
  const transfers = await Promise.all([
    getMultipleTokenTransfersByAnkr(from, to),
    ...availableNetworks
      .filter((network) => ANKR_API_UNSPPORTED_CHAINS[network.chainId])
      .map((network) =>
        getTokenTransfersByEtherscan(from, to, network.chainId)
      ),
  ]);

  const res: Record<string, number> = {};
  for (let i = 0; i < to.length; i += 1) {
    const _to = to[i].toLowerCase();
    res[_to] = 0;
    for (let j = 0; j < transfers.length; j += 1) {
      res[_to] += transfers[j][_to] ?? 0;
    }
  }

  return res;
};

const getEtherTransfersOnAllChain = async (
  from: string,
  to: string[]
): Promise<Record<string, number>> => {
  const transfers = await Promise.all(
    availableNetworks.map((network) =>
      getEtherTransfersByEtherscan(from, to, network.chainId)
    )
  );

  const res: Record<string, number> = {};
  for (let i = 0; i < to.length; i += 1) {
    const _to = to[i].toLowerCase();
    res[_to] = 0;
    for (let j = 0; j < transfers.length; j += 1) {
      res[_to] += transfers[j][_to] ?? 0;
    }
  }

  return res;
};

const getTransferCount = async (
  from: string,
  to: string[],
  chainId: number
): Promise<AssetTransferCount[]> => {
  const ethTransfer = chainId
    ? await getEtherTransfersByEtherscan(from, to, chainId)
    : await getEtherTransfersOnAllChain(from, to);
  let tokenTransfer: Record<string, number>;

  if (chainId) {
    if (ANKR_API_UNSPPORTED_CHAINS[chainId]) {
      tokenTransfer = await getTokenTransfersByEtherscan(from, to, chainId);
    } else {
      tokenTransfer = await getMultipleTokenTransfersByAnkr(from, to, chainId);
    }
  } else {
    tokenTransfer = await getTokenTransfersOnAllChain(from, to);
  }

  return to.map((_to) => ({
    from,
    to: _to,
    chainId,
    transferCount:
      (ethTransfer[_to.toLowerCase()] ?? 0) +
      (tokenTransfer[_to.toLowerCase()] ?? 0),
  }));
};

export default defineEventHandler<AssetTransferCount[]>(async (event) => {
  let query = getQuery(event);

  const from = String(query.from);
  const to = Array.isArray(query.to)
    ? (query.to as string[])
    : [String(query.to)];
  const chainIds = Array.isArray(query.chainIds)
    ? (query.chainIds as number[])
    : [Number(query.chainIds)];

  if (to.length === 0 || to.length !== chainIds.length) {
    throw Error("Invalid input");
  }

  const toByChainId: Record<number, string[]> = {};
  for (let i = 0; i < chainIds.length; i += 1) {
    const chainId = Number(chainIds[i]);
    if (toByChainId[chainId]) {
      toByChainId[chainId].push(to[i]);
    } else {
      toByChainId[chainId] = [to[i]];
    }
  }

  let res: AssetTransferCount[] = [];
  for (let [chainId, to] of Object.entries(toByChainId)) {
    res = [...res, ...(await getTransferCount(from, to, Number(chainId)))];
  }

  return res;
});
