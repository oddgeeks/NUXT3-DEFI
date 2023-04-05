import { ethers, utils } from "ethers";
import { BigNumber } from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { Forwarder__factory } from "@/contracts";

export function shortenHash(hash: string, length: number = 4) {
  if (!hash) return;
  if (hash.length < 12) return hash;
  const beginningChars = hash.startsWith("0x") ? length + 2 : length;
  const shortened =
    hash.substr(0, beginningChars) + "..." + hash.substr(-length);
  return shortened;
}

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

export function onImageError(this: HTMLImageElement) {
  const parentElement = this.parentElement;
  this.onerror = null;
  this.remove();

  if (parentElement) {
    parentElement.classList.add("bg-gray-300");
  }
}

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

export function cloneDeep<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function signedNumber(numb: string | number) {
  return new Intl.NumberFormat("en-US", {
    signDisplay: "exceptZero",
  }).format(toBN(numb).toNumber());
}

export function formatDecimal(value: string | number, decimalPlaces = 5) {
  if (!value) {
    value = "0";
  }

  return toBN(value).decimalPlaces(decimalPlaces).toFormat();
}

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

export const slack = async (
  message: string,
  type: ISlackMessageType = "success"
) => {
  await http("/api/slack", {
    method: "POST",
    body: {
      message,
      type,
    },
  });
};

export const calculateEstimatedFee = (
  params: CalculateFeeProps
): ICalculatedFee => {
  const { fee, multiplier = "0", discountDetails } = params;

  if (!fee)
    return {
      discountDetails: {
        discount: 0,
        name: "",
        tooltip: "",
        iconURL: "",
      },
      discountAmount: 0,
      amountAfterDiscount: 0,
      min: 0,
      max: 0,
      formattedAmountAfterDiscount: "0.00",
      formatted: "0.00",
    };

  const discount = discountDetails?.discount;

  const maxVal = toBN(fee)
    .dividedBy(10 ** 18)
    .toNumber();

  const minVal = toBN(fee)
    .dividedBy(multiplier)
    .dividedBy(10 ** 14)
    .toNumber();

  const actualMin = Math.max(minVal, 0.01);
  const actualMax = Math.max(maxVal, 0.01);

  const formattedMin = formatDecimal(String(actualMin), 2);
  const formattedMax = formatDecimal(String(actualMax), 2);

  const discountAmountMin = discount ? actualMin * discount : 0;
  const discountAmount = discount ? actualMax * discount : 0;

  const maxAmountAfterDiscount = discount
    ? actualMax - discountAmount
    : actualMax;
  const minAmountAfterDiscount = discount
    ? actualMin - discountAmountMin
    : actualMin;

  const formattedDiscountedAmountMin = formatDecimal(minAmountAfterDiscount, 2);
  const formattedDiscountedAmount = formatDecimal(maxAmountAfterDiscount, 2);

  const isEqual = formattedMin === formattedMax;

  const formatted = isEqual
    ? formattedMax
    : `${formattedMin} - ${formattedMax}`;

  const formattedAmountAfterDiscount = isEqual
    ? formattedDiscountedAmount
    : `${formattedDiscountedAmountMin} - ${formattedDiscountedAmount}`;

  return {
    discountDetails,
    discountAmount,
    min: actualMin,
    max: actualMax,
    formatted,
    amountAfterDiscount: maxAmountAfterDiscount,
    formattedAmountAfterDiscount,
  };
};
