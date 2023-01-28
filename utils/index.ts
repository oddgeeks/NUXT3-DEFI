import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { BigNumber as BN } from "ethers";
import axios from "axios";
import axiosRetry from "axios-retry";
import { RPC_URLS } from "~~/connectors";

export function shortenHash(hash: string, length: number = 4) {
  if (!hash) return;
  if (hash.length < 12) return hash;
  const beginningChars = hash.startsWith("0x") ? length + 2 : length;
  const shortened =
    hash.substr(0, beginningChars) + "..." + hash.substr(-length);
  return shortened;
}

const rpcInstances: Record<string, ethers.providers.JsonRpcProvider> = {};

export const getRpcProvider = (chainId: number | string) => {
  if (!rpcInstances[chainId]) {
    rpcInstances[chainId] = new ethers.providers.JsonRpcProvider(
      RPC_URLS[Number(chainId)]
    );
  }

  return rpcInstances[chainId];
};

export const toBN = (value: BigNumber.Value | BN) =>
  new BigNumber(BN.isBigNumber(value) ? value.toString() : value);
export const isZero = (value: BigNumber.Value | BN) => toBN(value).isZero();
export const times = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).times(toBN(b));
export const minus = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).minus(toBN(b));
export const plus = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).plus(toBN(b));
export const lte = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).lte(toBN(b));
export const gte = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).gte(toBN(b));
export const div = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).div(toBN(b));
export const lt = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).lt(toBN(b));
export const gt = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) =>
  toBN(a).gt(toBN(b));
export const ensureValue = (value: any) => {
  if (!value) return toBN("0");
  if (toBN(value).isNaN()) return toBN("0");

  return toBN(value);
};
export const max = (...args: BigNumber.Value[]) => {
  return BigNumber.max(...args);
};
export const chainIdToName = (chainId: string | number) => {
  switch (String(chainId)) {
    case "1":
      return "Mainnet";
    case "137":
      return "Polygon";
    case "10":
      return "Optimism";
    case "42161":
      return "Arbitrum";
    case "43114":
      return "Avalanche";
    case "100":
      return "Gnosis";
    case "56":
      return "BSC";
    case "250":
      return "Fantom";
    case "634":
      return "Avocado";
    default:
      throw new Error(`Unknown chainId ${chainId}`);
  }
};

export const getExplorerUrl = (
  chainId: string | number,
  suffix: `/${string}` = "/"
) => {
  switch (String(chainId)) {
    case "1":
      return "https://etherscan.io" + suffix;
    case "137":
      return "https://polygonscan.com" + suffix;
    case "43114":
      return "https://snowtrace.io" + suffix;
    case "10":
      return "https://optimistic.etherscan.io" + suffix;
    case "42161":
      return "https://arbiscan.io" + suffix;
    case "250":
      return "https://ftmscan.com" + suffix;
    case "56":
      return "https://bscscan.com" + suffix;
    case "100":
      return "https://gnosisscan.io" + suffix;
  }
};

const locale = "en-US";

export function formatUsd(value: any, fractionDigits = 2) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

  return formatter.format(value);
}

function getFractionDigits(value: string | number) {
  const absoluteValue = toBN(value).abs();

  if (isZero(absoluteValue)) {
    return 2;
  } else if (lt(absoluteValue, 0.01)) {
    return 6;
  } else if (lt(absoluteValue, 1)) {
    return 4;
  } else if (lt(absoluteValue, 10000)) {
    return 2;
  } else {
    return 0;
  }
}

export function formatDecimal(value: string, fractionDigits = getFractionDigits(value)) {
  if (!value) {
    value = "0";
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  });
  return formatter.format(toBN(value).toNumber());
}

export const http = axios.create();

export function filterArray(array: any, filters: any) {
  const filterKeys = Object.keys(filters);
  return array.filter((item: any) => {
    // validates all filter criteria
    return filterKeys.every((key) => {
      // ignores non-function predicates
      if (typeof filters[key] !== "function") return true;
      return filters[key](item[key], item);
    });
  });
}

export const injectFavicon = function (src: string) {
  const head = document.querySelector("head")!;
  const iconElement = document.createElement("link");
  iconElement.type = "image/x-icon";
  iconElement.rel = "icon";
  iconElement.href = src;

  const links = document.querySelectorAll('link[rel~="icon"]');

  for (var i = 0; i < links.length; i++) {
    head.removeChild(links[i]);
  }

  head.appendChild(iconElement);
};

axiosRetry(http, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
});

export const slack = async (
  message: string,
  type: ISlackMessageType = "success"
) => {
  await $fetch("/api/slack", {
    method: "POST",
    body: {
      message,
      type,
    },
  });
};

type FeeProps = {
  fee: string;
  multiplier: string;
  chanId: string;
};

const minFee = {
  "137": 0.01,
  "10": 0.005,
  "42161": 0.005,
  "43114": 0.005,
  "1": 0.005,
  "100": 0.01,
  "56": 0.01,
};

export const calculateEstimatedFee = (params: FeeProps) => {
  const { fee, multiplier = "0", chanId } = params;
  if (!fee) return "0.00";

  const minValue = minFee[String(chanId) as keyof typeof minFee];

  const maxVal = toBN(fee)
    .dividedBy(10 ** 18)
    .toFormat();

  const minVal = toBN(fee)
    .dividedBy(multiplier)
    .dividedBy(10 ** 14)
    .toFormat();

  if (toBN(maxVal).lt(minValue)) return formatDecimal(minValue, 2);

  const avg = toBN(maxVal).plus(toBN(minVal)).dividedBy(2).toFormat();

  return `${formatDecimal(avg, 2)}`;
};
