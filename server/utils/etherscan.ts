import { BigNumber } from "ethers";

const ETHERSCAN_BASE_URLS: Record<number, string> = {
  1: "https://api.etherscan.io",
  137: "https://api.polygonscan.com",
  42161: "https://api.arbiscan.io",
  10: "https://api-optimistic.etherscan.io",
  56: "https://api.bscscan.com",
  100: "https://api.gnosisscan.io",
  43114: "https://api.snowtrace.io",
};

export const getTokenTransfersFromEtherscan = async (
  from: string,
  to: string,
  chainId: number
): Promise<number> => {
  const baseUrl = ETHERSCAN_BASE_URLS[chainId];

  if (!baseUrl) {
    return 0;
  }

  let page = 0;
  const limit = 10000;

  let totalTransfer = 0;
  do {
    const res: any = await $fetch(
      `${baseUrl}/api?module=account&action=tokentx&address=${to}&sort=asc&startblock=0&page=${page}`
    );

    const filteredCount = res.result.filter(
      (item: any) =>
        item.from.toLowerCase() === from.toLowerCase() &&
        item.to.toLowerCase() === to.toLowerCase() &&
        !BigNumber.from(item.value).isZero()
    ).length;

    totalTransfer += filteredCount;

    page += 1;

    if (res.result.length < limit) {
      break;
    }
  } while (true);

  return totalTransfer;
};

export const getEtherTransfersFromEtherscan = async (
  from: string,
  to: string,
  chainId: number
): Promise<number> => {
  const baseUrl = ETHERSCAN_BASE_URLS[chainId];

  if (!baseUrl) {
    return 0;
  }

  let page = 0;
  const limit = 10000;

  let totalTransfer = 0;
  do {
    const res: any = await $fetch(
      `${baseUrl}/api?module=account&action=txlistinternal&address=${to}&sort=asc&startblock=0&page=${page}`
    );

    const filteredCount = res.result.filter(
      (item: any) =>
        item.from.toLowerCase() === from.toLowerCase() &&
        item.to.toLowerCase() === to.toLowerCase() &&
        !BigNumber.from(item.value).isZero()
    ).length;

    totalTransfer += filteredCount;

    page += 1;

    if (res.result.length < limit) {
      break;
    }
  } while (true);

  return totalTransfer;
};
