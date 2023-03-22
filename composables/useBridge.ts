import type { MaybeRef } from "@vueuse/core";
import type { IToken } from "~~/stores/tokens";
import { useForm } from "vee-validate";
import { Erc20__factory } from "~~/contracts";
import * as yup from "yup";
import { storeToRefs } from "pinia";

type IFee = {
  amount: string;
  feesInUsd: string;
  asset: IToken;
};

interface IBridge {
  fromChainId: MaybeRef<string>;
  tokenAddress: MaybeRef<string>;
}

export const useBridge = (props: IBridge) => {
  let txController: AbortController | null = null;
  let tokensController: AbortController | null = null;
  let routesController: AbortController | null = null;

  const { account } = useWeb3();
  const { fromWei, toWei } = useBignumber();
  const { tokenBalances, safeAddress } = useAvocadoSafe();
  const { getNetworkByChainId, networks } = useNetworks();
  const { tokens } = storeToRefs(useTokens());

  const fromChainId = ref(props.fromChainId);
  const toChainId = ref(props.fromChainId === "137" ? "10" : "137");
  const tokenAddress = ref(props.tokenAddress);

  const form = useForm({
    validationSchema: yup.object({
      amount: yup
        .string()
        .required("")
        .test("min-amount", "", (value: any) => {
          const amount = toBN(value);

          return value ? amount.gt(0) : true;
        })
        .test("max-amount", "Insufficient balance", (value: any) => {
          const amount = toBN(value);
          const balance = toBN(token.value.balance);

          return amount.gt(0) ? amount.lte(balance) : true;
        }),
    }),
  });

  const amount = form.useFieldModel("amount");

  const token = computed(
    () =>
      tokenBalances.value.find(
        (t) =>
          t.chainId === fromChainId.value && t.address === tokenAddress.value
      )!
  );

  const nativeCurrency = computed(() => {
    const nativeTokenMeta = getNetworkByChainId(+fromChainId.value).params
      .nativeCurrency;

    return tokens.value.find(
      (t) =>
        t.chainId == fromChainId.value &&
        t.symbol.toLowerCase() === nativeTokenMeta?.symbol?.toLowerCase()
    );
  });

  const bridgeToToken = computed(() => {
    const t = bridgeTokens.data.value?.find(
      (t: any) => t.symbol.toLowerCase() === token.value.symbol.toLowerCase()
    );

    if (t) return t;

    return bridgeTokens.data.value?.find((t: any) =>
      t.symbol.toLowerCase().includes(token.value.symbol.toLowerCase())
    );
  });

  const toAmount = computed(() =>
    formatDecimal(
      fromWei(
        txRoute.value?.toAmount || "0",
        bridgeToToken?.value?.decimals
      ).toFixed()
    )
  );

  const recivedValueInUsd = computed(() =>
    !txRoute?.value ? 0 : max(txRoute?.value.outputValueInUsd, 0)
  );

  const recievedAmount = computed(() =>
    toBN(recivedValueInUsd.value)
      .div(token.value.price ?? 1)
      .toFixed()
  );

  const bridgeTokens = useAsyncData(
    "bridge-tokens",
    async () => {
      try {
        if (tokensController) {
          tokensController.abort();
        }
        tokensController = new AbortController();

        const { result }: IBridgeTokensResponse = await http(
          "/api/socket/v2/token-lists/to-token-list",
          {
            signal: tokensController.signal,
            params: {
              fromChainId: fromChainId.value,
              toChainId: toChainId.value,
            },
          }
        );

        tokensController = null;

        return result;
      } catch (e) {
        console.log(e);
      }
    },
    {
      server: false,
      immediate: true,
      default: () => [],
      watch: [toChainId],
    }
  );

  const routes = useAsyncData(
    "bridge-routes",
    async () => {
      const { valid } = await form.validate();

      if (!valid) return;

      if (!bridgeToToken.value) {
        if (bridgeTokens.data.value?.length) {
          throw new Error("No bridge token found", {
            cause: "no-bridge-token",
          });
        } else return;
      }

      const transferAmount = toWei(amount.value || "0", token.value.decimals);

      try {
        if (routesController) {
          routesController.abort();
        }
        routesController = new AbortController();

        const data: IBridgeResponse = await http("/api/socket/v2/quote", {
          signal: routesController.signal,
          params: {
            fromTokenAddress: token.value.address,
            fromChainId: fromChainId.value,
            toChainId: toChainId.value,
            toTokenAddress: bridgeToToken.value.address,
            fromAmount: transferAmount,
            userAddress: safeAddress.value,
            recipient: safeAddress.value,
            singleTxOnly: true,
            bridgeWithGas: false,
            defaultSwapSlippage: 1,
            sort: "output",
            isContractCall: true,
          },
        });

        routesController = null;

        if (!data.result.routes.length) {
          throw new Error(
            "Our bridge provider does not have routes for your desired transfer",
            {
              cause: "no-routes",
            }
          );
        }

        return data;
      } catch (error: any) {
        console.log(error);
        throw new Error(
          error.cause
            ? error.message
            : "Unexpected error, please try again later"
        );
      }
    },
    {
      server: false,
      immediate: false,
      watch: [amount, bridgeToToken],
    }
  );

  const txRoute = computed(() => {
    const [route] = routes.data.value?.result.routes || [];

    return route ?? null;
  });

  const transactions = useAsyncData(
    "bridge-transactions",
    async () => {
      const txs = [];

      if (!txRoute.value) return;

      for (const userTx of txRoute.value?.userTxs || []) {
        if (userTx.approvalData) {
          const erc20 = Erc20__factory.connect(
            token.value.address,
            getRpcProvider(fromChainId.value)
          );
          const { data } = await erc20.populateTransaction.approve(
            userTx.approvalData.allowanceTarget,
            userTx.approvalData.minimumApprovalAmount
          );

          txs.push({
            to: token.value.address,
            data,
          });
        }
      }

      if (txController) {
        txController.abort();
      }

      txController = new AbortController();

      const buildTx = await http("/api/socket/v2/build-tx", {
        signal: txController.signal,
        method: "POST",
        body: {
          route: txRoute.value,
        },
      });

      txController = null;

      txs.push({
        to: buildTx.result.txTarget,
        data: buildTx.result.txData,
        value: buildTx.result.value,
      });

      return txs;
    },
    {
      watch: [txRoute],
    }
  );

  const nativeFee = computed(() => {
    let v =
      transactions.data.value?.reduce((acc: any, tx: any) => {
        return toBN(acc)
          .plus(fromWei(tx?.value || "0", nativeCurrency.value?.decimals))
          .toFixed();
      }, "0") || "0";

    if (token.value.address === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      v = toBN(v)
        .minus(amount.value || "0")
        .toFixed(0);
    }

    return v;
  });

  const nativeFeeInUsd = computed(() =>
    times(nativeFee.value!, nativeCurrency.value?.price || 0)
  );

  const isInsufficientBalance = computed(() => {
    const nativeBalance =
      tokenBalances.value.find(
        (t) =>
          t.chainId == token.value.chainId &&
          t.symbol === nativeCurrency.value?.symbol
      )?.balance || "0";

    return toBN(nativeBalance).lt(nativeFee.value!);
  });

  const bridgeFee = computed<IFee>(() => {
    const fallback: IFee = {
      amount: "0",
      feesInUsd: "0",
      asset: nativeCurrency.value as IToken,
    };

    if (!txRoute.value) {
      return fallback;
    }

    const fees = txRoute.value?.userTxs.reduce((acc: IFee, tx: any) => {
      const bridgeFee = tx.steps.reduce((acc: any, step: any) => {
        if (!step?.protocolFees) return acc;

        const asset = step?.protocolFees?.asset;
        const assetPrice = tokenBalances.value.find(
          (i) => i.address.toLowerCase() === asset?.address.toLowerCase()
        );

        const amount = fromWei(
          toBN(acc.amount || "0").plus(toBN(step?.protocolFees?.amount || "0")),
          step?.protocolFees?.asset?.decimals
        );

        return {
          amount: amount.toFixed(),
          feesInUsd: toBN(acc.feesInUsd || "0")
            .plus(amount.times(assetPrice?.price || 0))
            .toFixed(),
          asset: step?.protocolFees?.asset,
        };
      }, fallback);

      return {
        amount: toBN(bridgeFee.amount)
          .plus(toBN(acc.amount || "0"))
          .toFixed(),
        feesInUsd: toBN(bridgeFee.feesInUsd)
          .plus(toBN(acc.feesInUsd || "0"))
          .toFixed(),
        asset: bridgeFee.asset,
      };
    }, fallback);

    return fees;
  });

  const handleSwapToken = () => {
    const balancedToken = tokenBalances.value.find(
      (t) =>
        gt(t.balance, "0") &&
        t.chainId == fromChainId.value &&
        t.symbol !== nativeCurrency.value?.symbol
    );

    const fallbackToken = tokens.value.find(
      (i) => i.chainId == fromChainId.value
    );
    const isSameToken =
      token.value?.symbol.toLowerCase() ===
      nativeCurrency.value?.symbol.toLowerCase();

    const fromAddress = !isSameToken
      ? token.value
      : balancedToken || fallbackToken;

    const fromAmount = toBN(nativeFee.value)
      .times(nativeCurrency.value?.price || "0")
      .div(fromAddress?.price || "0")
      .toFixed(5);

    openSwapModal(
      fromAddress?.address!,
      fromChainId.value,
      nativeCurrency.value?.address!,
      fromAmount
    );
  };

  const selectableChains = computed(() =>
    networks.filter(
      (c) => String(c.chainId) !== fromChainId.value && c.chainId !== avoChainId
    )
  );

  const disabled = computed(
    () =>
      !token.value ||
      !account.value ||
      bridgeTokens.pending.value ||
      !txRoute.value ||
      !form.meta.value.valid ||
      !!transactions.error.value ||
      loading.value ||
      isInsufficientBalance.value
  );

  const loading = computed(
    () =>
      form.isSubmitting.value ||
      routes.pending.value ||
      transactions.pending.value ||
      bridgeTokens.pending.value
  );

  onUnmounted(() => {
    clearNuxtData("bridge-transactions");
    clearNuxtData("bridge-tokens");
    clearNuxtData("bridge-routes");
  });

  return {
    amount,
    toAmount,
    toChainId,
    fromChainId,
    bridgeToToken,
    routes,
    token,
    txRoute,
    form,
    bridgeFee,
    disabled,
    loading,
    nativeCurrency,
    transactions,
    nativeFee,
    nativeFeeInUsd,
    isInsufficientBalance,
    selectableChains,
    handleSwapToken,
    recivedValueInUsd,
    recievedAmount,
  };
};
