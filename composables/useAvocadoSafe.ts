import { storeToRefs } from "pinia";
import { createSafe } from "@instadapp/avocado";

export const useAvocadoSafe = () => {
  const { switchNetworkByChainId } = useNetworks();
  const { library } = useWeb3();

  // check if we have a cached safe address
  const { safeAddress, tokenBalances, totalBalance, chainTokenBalances } =
    storeToRefs(useSafe());

  const safe = shallowRef<ReturnType<typeof createSafe>>();
  const signer = computed(() => (safe.value ? safe.value.getSigner() : null));

  watch(
    library,
    () => {
      safe.value = library.value
        ? createSafe(library.value.getSigner())
        : undefined;
    },
    { immediate: true }
  );

  const sendTransaction = async (transaction: {
    to: string;
    value?: string;
    data?: string;
    chainId: number | string;
  }, options?: { metadata?: string }) => {
    await switchNetworkByChainId(75);

    if (!signer.value) {
      throw new Error("Safe not initialized");
    }

    const tx = await signer.value.sendTransaction({
      ...transaction,
      chainId: Number(transaction.chainId),
    }, options);

    return tx.hash!;
  };

  const sendTransactions = async (
    transactions: { to: string; value?: string; data?: string }[],
    chainId: number | string,
    options?: { metadata?: string },
  ) => {
    await switchNetworkByChainId(75);

    if (!signer.value) {
      throw new Error("Safe not initialized");
    }

    const tx = await signer.value.sendTransactions(
      transactions,
      Number(chainId),
      options,
    );

    return tx.hash!;
  };

  return {
    tokenBalances,
    totalBalance,
    safeAddress,
    sendTransaction,
    sendTransactions,
    chainTokenBalances,
  };
};
