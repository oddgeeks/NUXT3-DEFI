import { utils, constants } from "ethers";
import { AnkrProvider, Blockchain } from "@ankr.com/ankr.js";

const { ankrApiKey } = useRuntimeConfig();

// Setup provider AnkrProvider
const ankrProvider = new AnkrProvider(ankrApiKey);

export const ANKR_API_UNSPPORTED_CHAINS: Record<number, boolean> = {
  100: true,
  1101: true,
};

export const getTokenTransfersByAnkr = async (
  from: string,
  to: string,
  chainId?: number
): Promise<number> => {
  if (chainId && ANKR_API_UNSPPORTED_CHAINS[chainId]) {
    return 0;
  }

  const chains: Blockchain | Blockchain[] | undefined = chainId
    ? <Blockchain | undefined>(
        availableNetworks.find((network) => Number(network.chainId) === chainId)
          ?.ankrName
      )
    : <Blockchain[]>(
        availableNetworks
          .filter(
            (network) =>
              !ANKR_API_UNSPPORTED_CHAINS[network.chainId] && network.ankrName
          )
          .map((network) => network.ankrName!)
      );

  if (!chains) {
    return 0;
  }

  const fromBytes32 = utils.hexZeroPad(from, 32).toLowerCase();
  const toBytes32 = utils.hexZeroPad(to, 32).toLowerCase();

  let pageToken: string | undefined;

  let totalTransfer = 0;
  do {
    const res = await ankrProvider.getLogs({
      blockchain: chains,
      fromBlock: 0,
      toBlock: "latest",
      topics: [
        utils.id("Transfer(address,address,uint256)"),
        fromBytes32,
        toBytes32,
      ],
      pageToken,
      descOrder: false,
    });

    // Filter only ERC20 transfer events.
    const filteredCount = res.logs.filter(
      (log) => log.data !== "0x" && log.data !== constants.HashZero
    ).length;

    totalTransfer += filteredCount;

    if (res.nextPageToken) {
      pageToken = res.nextPageToken;
    } else {
      break;
    }
  } while (true);

  return totalTransfer;
};

export const getMultipleTokenTransfersByAnkr = async (
  from: string,
  to: string[],
  chainId?: number
): Promise<Record<string, number>> => {
  const res = await Promise.all(
    to.map((_to) => getTokenTransfersByAnkr(from, _to, chainId))
  );

  const transferCounts: Record<string, number> = {};
  for (let i = 0; i < to.length; i += 1) {
    transferCounts[to[i].toLowerCase()] = res[i];
  }

  return transferCounts;
};
