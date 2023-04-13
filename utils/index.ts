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
<<<<<<< HEAD

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
=======
>>>>>>> a4638a918e7b7d43fd89a1456972136ca39978cf
