import { isArray } from "@vue/shared";
import { storeToRefs } from "pinia";

interface EstimatedFeeParams {
  chainId: string;
  immediate?: boolean;
  cb?: () => void;
  disabled?: () => boolean;
  options?: any;
}

export function useEstimatedFee(txData: Ref, params: EstimatedFeeParams) {
  const { avoProvider } = useSafe();
  const { account } = useWeb3();
  const { safe } = useAvocadoSafe();
  const { gasBalance } = storeToRefs(useSafe());

  const immediate = !!params.immediate;

  const data = computed(() => {
    const isArbitrumChain = params.chainId == "42161"

    const discountDetails: DiscountDetails = {
      name: "Arbitrum Gas Discount",
      discount: isArbitrumChain ? 0.8 : undefined,
      tooltip: `Avocado users are granted a gas discount on the Arbitrum Network for a limited time. <a href='/'> Learn more </a>`,
    };

    return calculateEstimatedFee({
      chainId: params.chainId,
      ...rawData.value,
      discountDetails,
    });
  });

  const err = computed(() => {
    const message = "Something went wrong. Please try again!";
    if (pending.value) return;
    if (error.value) return message;

    if (rawData.value && (!rawData.value?.fee || !rawData.value?.multiplier))
      return message;

    if (toBN(gasBalance.value).lt(data.value?.amountAfterDiscount!))
      return "Not enough USDC gas";
  });

  const {
    data: rawData,
    error,
    pending,
  } = useAsyncData(
    "estimated-fee",
    async () => {
      try {
        const disabled = params.disabled?.();
        if (disabled) return;

        if (!txData.value) return;

        const isArr = isArray(txData.value);

        if (isArr && txData.value.length === 0) return;

        const actualTx = isArray(txData.value) ? txData.value : [txData.value];

        const message = await safe.value?.generateSignatureMessage(
          actualTx,
          +params.chainId,
          params.options
        );

        const data = await avoProvider.send("txn_estimateFeeWithoutSignature", [
          message,
          account.value,
          params.chainId,
        ]);

        return data;
      } finally {
        params.cb?.();
      }
    },
    {
      server: false,
      immediate,
      watch: [txData],
    }
  );

  onUnmounted(() => {
    clearNuxtData("estimated-fee");
  });

  return {
    data,
    rawData,
    error: err,
    pending,
  };
}
