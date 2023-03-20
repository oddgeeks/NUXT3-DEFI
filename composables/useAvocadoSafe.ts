import { storeToRefs } from "pinia";

export const useAvocadoSafe = () => {
  const { switchToAvocadoNetwork } = useNetworks();
  const { library, account } = useWeb3();
  const { avoProvider } = useSafe();

  // check if we have a cached safe address
  const { safeAddress, tokenBalances, totalBalance } = storeToRefs(useSafe());

  const safe = shallowRef<ReturnType<typeof avocado.createSafe>>();
  const signer = computed(() => (safe.value ? safe.value.getSigner() : null));

  watch(
    [library, account],
    () => {
      safe.value = library.value
        ? avocado.createSafe(library.value.getSigner().connectUnchecked())
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
      operation?: string;
    },
    options: { metadata?: string; id?: string } = {}
  ) => {
    await switchToAvocadoNetwork();

    if (!signer.value) {
      throw new Error("Safe not initialized");
    }

    const tx = await signer.value.sendTransaction(
      {
        ...transaction,
        chainId: Number(transaction.chainId),
      },
      { source: "0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E", ...options }
    );

    return tx.hash!;
  };

  const sendTransactions = async (
    transactions: {
      to: string;
      value?: string;
      data?: string;
      operation?: string;
    }[],
    chainId: number | string,
    options: { metadata?: string; id?: string } = {}
  ) => {
    await switchToAvocadoNetwork();

    if (!signer.value) {
      throw new Error("Safe not initialized");
    }

    const tx = await signer.value.sendTransactions(
      transactions,
      Number(chainId),
      { source: "0xE8385fB3A5F15dED06EB5E20E5A81BF43115eb8E", ...options }
    );

    return tx.hash!;
  };

  const { data: airDrop, execute } = useAsyncData(
    "airDrop",
    async () => {
      const resp = await avoProvider.send("api_hasAirdrop", [account.value]);

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
    account,
    safeAddress,
    sendTransaction,
    sendTransactions,
    airDrop,
    fetchAirDrop: execute,
  };
};
