import { storeToRefs } from "pinia";
import { createSafe } from "avocado-safe";

export const useAvocadoSafe = () => {
  const provider = getRpcProvider(634);
  const { switchNetworkByChainId } = useNetworks();
  const { library, account } = useWeb3();

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

  const sendTransaction = async (
    transaction: {
      to: string;
      value?: string;
      data?: string;
      chainId: number | string;
    },
    options: { metadata?: string } = {}
  ) => {
    await switchNetworkByChainId(634);

    if (!signer.value) {
      throw new Error("Safe not initialized");
    }

    const tx = await signer.value.sendTransaction(
      {
        ...transaction,
        chainId: Number(transaction.chainId),
      },
      { source: "0x000000000000000000000000000000000000Cad0", ...options }
    );

    return tx.hash!;
  };

  const sendTransactions = async (
    transactions: { to: string; value?: string; data?: string }[],
    chainId: number | string,
    options: { metadata?: string } = {}
  ) => {
    await switchNetworkByChainId(634);

    if (!signer.value) {
      throw new Error("Safe not initialized");
    }

    const tx = await signer.value.sendTransactions(
      transactions,
      Number(chainId),
      { source: "0x000000000000000000000000000000000000Cad0", ...options }
    );

    return tx.hash!;
  };

  const { data: airDrop, execute } = useAsyncData(
    "airDrop",
    async () => {
      const resp = await provider.send("api_hasAirdrop", [account.value]);

      return resp;
    },
    {
      watch: [account],
      server: false,
    }
  );

  return {
    safe,
    tokenBalances,
    totalBalance,
    safeAddress,
    sendTransaction,
    sendTransactions,
    chainTokenBalances,
    airDrop,
    fetchAirDrop: execute,
  };
};
