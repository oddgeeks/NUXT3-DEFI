import { ethers, utils } from "ethers";
import { BigNumber } from "bignumber.js";
import { BigNumber as BN } from "ethers";
import { Forwarder__factory } from "@/contracts";
import { RPC_URLS } from "~~/connectors";
import { AVO_PROD_CHAIN_ID, AVO_STAGING_CHAIN_ID } from "./avocado";

const multiMetadataTypes = ["bytes[]"];

const metadataTypes = ["bytes32 type", "uint8 version", "bytes data"];

const actionMetadataTypes = {
  transfer: ["address token", "uint256 amount", "address receiver"],
  bridge: [
    "uint256 amount",
    "address receiver",
    "address fromToken",
    "address toToken",
    "uint256 toChainId",
    "uint256 bridgeFee",
    "address nativeToken",
  ],
  swap: [
    "address sellToken",
    "address buyToken",
    "uint256 sellAmount",
    "uint256 buyAmount",
    "address receiver",
    "bytes32 protocol",
  ],
  "gas-topup": ["uint256 amount", "address token", "address onBehalf"],
  upgrade: ["bytes32 version", "address walletImpl"],
  dapp: ["string name", "string url"],
  deploy: [],
  permit2: [
    "address token",
    "address spender",
    "uint160 amount",
    "uint48 expiration",
  ],
};

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
    case String(AVO_PROD_CHAIN_ID):
    case String(AVO_STAGING_CHAIN_ID):
      return "Avocado";
    default:
      throw new Error(`Unknown chainId ${chainId}`);
  }
};

export function onImageError(this: HTMLImageElement) {
  const parentElement = this.parentElement;
  this.onerror = null;
  this.remove();

  if (parentElement) {
    parentElement.classList.add("bg-gray-300");
  }
}

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

const encodeMetadata = (props: MetadataProps) => {
  return ethers.utils.defaultAbiCoder.encode(metadataTypes, [
    ethers.utils.formatBytes32String(props.type),
    props.version || "1",
    props.encodedData,
  ]);
};

export const encodeDappMetadata = (
  params: DappMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes.dapp,
    [params.name, params.url]
  );

  const data = encodeMetadata({
    type: "dapp",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeTransferMetadata = (
  params: SendMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes.transfer,
    [params.token, params.amount, params.receiver]
  );

  const data = encodeMetadata({
    type: "transfer",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeDeployMetadata = (single = true) => {
  const data = encodeMetadata({
    type: "deploy",
    encodedData: "0x",
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeWCSignMetadata = (
  params: SignMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes["permit2"],
    [params.token, params.spender, params.amount, params.expiration]
  );

  const data = encodeMetadata({
    type: "permit2",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeUpgradeMetadata = (
  params: UpgradeMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes.upgrade,
    [params.version, params.walletImpl]
  );

  const data = encodeMetadata({
    type: "upgrade",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeSwapMetadata = (
  params: SwapMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes.swap,
    [
      params.sellToken,
      params.buyToken,
      params.sellAmount,
      params.buyAmount,
      params.receiver,
      params.protocol,
    ]
  );

  const data = encodeMetadata({
    type: "swap",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeTopupMetadata = (
  params: TopupMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes["gas-topup"],
    [params.amount, params.token, params.onBehalf]
  );

  console.log(params);

  const data = encodeMetadata({
    type: "gas-topup",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeBridgeMetadata = (
  params: BridgeMetadataProps,
  single = true
) => {
  const encodedData = ethers.utils.defaultAbiCoder.encode(
    actionMetadataTypes.bridge,
    [
      params.amount,
      params.receiver,
      params.fromToken,
      params.toToken,
      params.toChainId,
      params.bridgeFee,
      params.nativeToken,
    ]
  );

  const data = encodeMetadata({
    type: "bridge",
    encodedData,
  });

  return single ? encodeMultipleActions(data) : data;
};

export const encodeMultipleActions = (...actionData: string[]) => {
  return ethers.utils.defaultAbiCoder.encode(multiMetadataTypes, [actionData]);
};

export const decodeMetadata = (data: string) => {
  try {
    const iface = Forwarder__factory.createInterface();
    let metadata = "0x";
    let payload = {};

    if (!data) return payload;

    if (data.startsWith("0x18e7f485")) {
      const executeData = iface.decodeFunctionData("execute", data);
      if (executeData.metadata_ === "0x" || !executeData.metadata_) {
        return null;
      } else {
        metadata = executeData.metadata_;
      }
    } else {
      const executeDataV2 = iface.decodeFunctionData("executeV2", data);
      if (
        executeDataV2.params_.metadata === "0x" ||
        !executeDataV2.params_.metadata
      ) {
        return null;
      } else {
        metadata = executeDataV2.params_.metadata;
      }
    }

    const metadataArr = [];

    const [decodedMultiMetadata = []] =
      (ethers.utils.defaultAbiCoder.decode(
        multiMetadataTypes,
        metadata
      ) as string[]) || [];

    for (let metadata of decodedMultiMetadata) {
      const decodedMetadata = ethers.utils.defaultAbiCoder.decode(
        metadataTypes,
        metadata
      );

      const type = ethers.utils.parseBytes32String(
        decodedMetadata.type
      ) as keyof typeof actionMetadataTypes;

      const decodedData = ethers.utils.defaultAbiCoder.decode(
        actionMetadataTypes[type],
        decodedMetadata.data
      );

      switch (type) {
        case "transfer":
          payload = {
            type,
            token: decodedData.token,
            amount: toBN(decodedData.amount).toFixed(),
            receiver: decodedData.receiver,
          };
          break;
        case "bridge":
          payload = {
            type,
            amount: toBN(decodedData.amount).toFixed(),
            receiver: decodedData.receiver,
            toToken: decodedData.toToken,
            fromToken: decodedData.fromToken,
            toChainId: decodedData.toChainId
              ? decodedData.toChainId.toString()
              : null,
            bridgeFee: toBN(decodedData.bridgeFee).toFixed(),
          };
          break;
        case "swap":
          payload = {
            type,
            buyAmount: toBN(decodedData.buyAmount).toFixed(),
            sellAmount: toBN(decodedData.sellAmount).toFixed(),
            buyToken: decodedData.buyToken,
            sellToken: decodedData.sellToken,
            receiver: decodedData.receiver,
            protocol: utils.parseBytes32String(decodedData?.protocol || ""),
          };
          break;
        case "upgrade":
          payload = {
            type,
            version: utils.parseBytes32String(decodedData?.version || ""),
            walletImpl: decodedData?.walletImpl,
          };
          break;
        case "gas-topup":
          payload = {
            type,
            amount: toBN(decodedData.amount).toFixed(),
            token: decodedData.token,
            onBehalf: decodedData.onBehalf,
          };
          break;
        case "dapp":
          payload = {
            type,
            name: decodedData?.name,
            url: decodedData?.url,
          };
          break;
        case "deploy":
          payload = {
            type,
          };

        case "permit2":
          payload = {
            type,
            token: decodedData.token,
            spender: decodedData.spender,
            amount: toBN(decodedData.amount).toFixed(),
            expiration: decodedData.expiration,
          };

          break;
      }

      metadataArr.push(payload);
    }

    return metadataArr;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const nameToChainId = (chainId: string | undefined) => {
  switch (chainId) {
    case "eth":
    case "ethereum":
      return 1;
    case "optimism":
      return 10;
    case "bsc":
      return 56;
    case "polygon":
      return 137;
    case "arbitrum":
      return 42161;
    case "avalanche":
      return 43114;
    default:
      return null;
  }
};
