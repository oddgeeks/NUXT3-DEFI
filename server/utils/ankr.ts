import { utils, constants } from "ethers";
import { AnkrProvider, Blockchain } from "@ankr.com/ankr.js";

const { ankrApiKey } = useRuntimeConfig();

// Setup provider AnkrProvider
const ankrProvider = new AnkrProvider(ankrApiKey);

const GNOSIS_CHAIN_ID = 100;

export const getTokenTransfersFromAnkr = async (
  from: string,
  to: string,
  chainId?: number
): Promise<number> => {
  const chains: Blockchain | Blockchain[] | undefined = chainId
    ? <Blockchain | undefined>(
        availableNetworks.find((network) => Number(network.chainId) === chainId)
          ?.ankrName
      )
    : <Blockchain[]>(
        availableNetworks
          .filter(
            (network) => network.chainId !== GNOSIS_CHAIN_ID && network.ankrName
          )
          .map((network) => network.ankrName!)
      );

  // If chain Id is gnosis, return 0
  if (chainId === GNOSIS_CHAIN_ID || !chains) {
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
