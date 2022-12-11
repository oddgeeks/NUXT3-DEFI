import { ethers } from "ethers";
import { RPC_URLS } from "~~/connectors";

export function shortenHash(hash: string, length: number = 4) {
  if (!hash) return;
  if (hash.length < 12) return hash;
  const beginningChars = hash.startsWith("0x") ? length + 2 : length;
  const shortened =
    hash.substr(0, beginningChars) + "..." + hash.substr(-length);
  return shortened;
}

const rpcInstances: Record<string, ethers.providers.JsonRpcProvider> = {}

export const getRpcProvider = (chainId: number | string) => {
  if (!rpcInstances[chainId]) {
    rpcInstances[chainId] = new ethers.providers.JsonRpcProvider(RPC_URLS[Number(chainId)])
  }

  return rpcInstances[chainId]
}

import { BigNumber } from "bignumber.js"
import { BigNumber as BN } from "@ethersproject/bignumber"

export const toBN = (value: BigNumber.Value | BN) => new BigNumber(
  BN.isBigNumber(value) ? value.toString() : value
)
export const isZero = (value: BigNumber.Value | BN) => toBN(value).isZero()
export const times = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).times(toBN(b))
export const minus = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).minus(toBN(b))
export const plus = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).plus(toBN(b))
export const lte = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).lte(toBN(b))
export const gte = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).gte(toBN(b))
export const div = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).div(toBN(b))
export const lt = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).lt(toBN(b))
export const gt = (a: BigNumber.Value | BN, b: BigNumber.Value | BN) => toBN(a).gt(toBN(b))
export const ensureValue = (value: any) => {
  if (!value) return toBN('0')
  if (toBN(value).isNaN()) return toBN('0')

  return toBN(value)
}
export const max = (...args: BigNumber.Value[]) => {
  return BigNumber.max(...args)
}
export const chainIdToName = (chainId: string) => {
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
    default:
      return "Mainnet";
  }
};

const locale = "en-US";

export function formatUsd(value: any, fractionDigits = 2) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  });

  return formatter.format(value);
}

export function formatDecimal(
  value: any,
  fractionDigits = 6
) {
  let formatter;
  if (lt(value, "0.000001") && gt(value, "0")) {
    formatter = new Intl.NumberFormat(locale, {
      style: "decimal",
      notation: "scientific",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  } else {
    formatter = new Intl.NumberFormat(locale, {
      style: "decimal",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    });
  }

  return formatter.format(value);
}