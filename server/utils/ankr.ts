import { utils, constants } from "ethers";
import { AnkrProvider, Blockchain } from "@ankr.com/ankr.js";

const { ankrApiKey } = useRuntimeConfig();

// Setup provider AnkrProvider
const ankrProvider = new AnkrProvider(ankrApiKey);

const ALL_ANKR_BLOCKCHAIN: Blockchain[] = [
  "eth",
  "polygon",
  "arbitrum",
  "optimism",
  "bsc",
  "avalanche",
];

const CHAIN_ID_TO_ANKR_BLOCKCHAIN: Record<number, Blockchain> = {
  1: "eth",
  137: "polygon",
  42161: "arbitrum",
  10: "optimism",
  56: "bsc",
  43114: "avalanche",
};

export const getTokenTransfersFromAnkr = async (
  from: string,
  to: string,
  chainId?: number
): Promise<number> => {
  // If chain Id is gnosis, return 0
  if (chainId && !CHAIN_ID_TO_ANKR_BLOCKCHAIN[chainId]) {
    return 0;
  }

  const fromBytes32 = utils.hexZeroPad(from, 32).toLowerCase();
  const toBytes32 = utils.hexZeroPad(to, 32).toLowerCase();

  let pageToken: string | undefined;

  let totalTransfer = 0;
  do {
    const res = await ankrProvider.getLogs({
      blockchain: chainId
        ? CHAIN_ID_TO_ANKR_BLOCKCHAIN[chainId]
        : ALL_ANKR_BLOCKCHAIN,
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
