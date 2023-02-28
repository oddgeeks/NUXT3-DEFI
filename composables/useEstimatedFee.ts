import { isArray } from "@vue/shared";
import { storeToRefs } from "pinia";

interface EstimatedFeeParams {
  chainId: string;
  immediate?: boolean;
  cb?: () => void;
  disabled?: () => boolean;
}

export function useEstimatedFee(txData: Ref, params: EstimatedFeeParams) {
  const provider = getRpcProvider(634);
  const { account } = useWeb3();
  const { safe } = useAvocadoSafe();
  const { gasBalance } = storeToRefs(useSafe());

  const immediate = !!params.immediate;

  const raw = ref({
    data: ref<any>(undefined),
    pending: false,
    error: undefined as Error | undefined,
  });

  const data = computed(() =>
    calculateEstimatedFee({ chainId: params.chainId, ...raw.value.data })
  );

  const err = computed(() => {
    const message = "Something went wrong. Please try again!";
    if (raw.value.pending) return;
    if (raw.value.error) return message;

    if (raw.value.data && (!raw.value.data?.fee || !raw.value.data?.multiplier))
      return message;

    if (toBN(gasBalance.value).lt(data.value?.max!))
      return "Not enough USDC gas";
  });

  const fetchEstimatedFee = async () => {
    try {
      const disabled = params.disabled?.();
      if (disabled) return;

      if (!txData.value) return;

      raw.value.pending = true;

      const isArr = isArray(txData.value);

      if (isArr && txData.value.length === 0) return;

      const actualTx = isArray(txData.value) ? txData.value : [txData.value];

      const message = await safe.value?.generateSignatureMessage(
        actualTx,
        +params.chainId
      );

      const data = await provider.send("txn_estimateFeeWithoutSignature", [
        message,
        account.value,
        params.chainId,
      ]);

      raw.value.data = data;
      raw.value.error = undefined;
    } catch (e: any) {
      console.error(e);
      raw.value.error = e;
      raw.value.data = undefined;
    } finally {
      params.cb?.();
      raw.value.pending = false;
    }
  };

  watch(
    txData,
    () => {
      fetchEstimatedFee();
    },
    {
      immediate: immediate,
    }
  );

  return {
    data,
    error: err,
    pending: computed(() => raw.value.pending),
  };
}
