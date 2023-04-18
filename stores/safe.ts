import { ethers } from "ethers";
import { acceptHMRUpdate, defineStore, storeToRefs } from "pinia";
import { GaslessWallet__factory, Forwarder__factory, TokenBalanceResolver__factory, TokenBalanceResolver } from "~/contracts";
import { IToken } from "./tokens";
import { wait } from "@instadapp/utils";
import collect from "collect.js";

export interface IBalance extends IToken {
  balance: string;
  balanceInUSD: string | null;
}

const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
  acc[curr.chainId] = TokenBalanceResolver__factory.connect(
    "0x3fb128aa5ac254c8539996b11c587e521ae0d3ab",
    getRpcProvider(curr.chainId)
  );
  return acc;
}, {} as Record<string, TokenBalanceResolver>);

const getChainBalances = async (
  chainId: string,
  address: string,
  tokens: string[] = []
) => {
  let newBalances: IBalance[] = [];

  const chainTokenAddresses = collect(tokens)
    .chunk(chainId === "42161" ? 5 : 20)
    .all();

  await Promise.all(
    chainTokenAddresses.map(async (chunk: any[]) => {
      const addresses = (chunk as any).all();

      const [{ balances }, prices] = await Promise.all([
        balanceResolverContracts[chainId].callStatic.getBalances(address, addresses),
        $fetch<IToken[]>(`https://prices.instadapp.io/${chainId}/tokens`, {
          params: {
            includeSparklinePrice7d: false,
            addresses,
          },
        }),
      ]);

      for (let index = 0; index < balances.length; index++) {
        let tokenAddress = addresses[index];
        let tokenPrice = prices.find(
          (p) => p.address.toLowerCase() === tokenAddress.toLowerCase()
        );
        if (!tokenPrice) continue;
        if (!balances[index].success) continue;

        let balance = toBN(balances[index].balance).div(10 ** tokenPrice.decimals);

        if (balance.gt(0)) {
          newBalances.push({
            name: tokenPrice.name,
            address: tokenPrice.address,
            decimals: tokenPrice.decimals,
            symbol: tokenPrice.symbol,
            logoURI: tokenPrice.logoURI,
            chainId: String(chainId),
            price: String(tokenPrice?.price || 0) as any,
            balance: balance.toFixed(6, 1),
            balanceInUSD: balance.times(tokenPrice?.price || 0).toFixed(2),
          } as any);
        }
      }
    })
  );

  return newBalances;
};

export const useSafe = defineStore("safe", () => {
  // balance aborter
  const balanceAborter = ref<AbortController>();
  const safeAddress = ref();

  const { account } = useWeb3();
  const { tokens, customTokens } = storeToRefs(useTokens());
  const documentVisibility = useDocumentVisibility();
  const { parseTransactionError } = useErrorHandler();

  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    new ethers.providers.JsonRpcProvider(getRpcURLByChainId(137))
  );

  const avoProvider = getRpcProvider(avoChainId);

  const networkPreference = ref(
    new Set(availableNetworks.map((el) => el.chainId))
  );

  const balances = ref({
    data: undefined as IBalance[] | undefined,
    loading: false,
    error: null as Error | null,
  });

  const gasBalance = ref();
  const pending = ref<Record<string, boolean>>({
    gasBalance: false,
    global: false,
  });

  const totalBalance = computed(() =>
    tokenBalances.value?.reduce(
      (acc, curr) => acc.plus(curr.balanceInUSD || "0"),
      toBN(0) || toBN(0)
    )
  );

  const fetchSafeddress = async () => {
    if (!account.value) {
      safeAddress.value = undefined;
      return;
    }

    safeAddress.value = await forwarderProxyContract.computeAddress(
      account.value
    );
  };

  const tokenBalances = computed(() => {
    if (!safeAddress.value || !tokens.value?.length) {
      return [];
    }

    return cloneDeep(tokens.value)
      .map((tb) => {
        const tokenBalance: IBalance = {
          ...tb,
          balance: "0",
          balanceInUSD: "0",
        };
        const balance = balances.value.data?.find(
          (b: any) =>
            b.address.toLowerCase() === tb.address.toLowerCase() &&
            tb.chainId == b.chainId
        );

        if (balance) {
          tokenBalance.balance = balance.balance;
          tokenBalance.balanceInUSD = toBN(tb.price || 0).gt(0)
            ? toBN(balance.balance)
              .times(tb.price || 0)
              .toFixed(2)
            : balance.balanceInUSD;
        }

        return tokenBalance;
      })
      .sort((a, b) =>
        toBN(b.balanceInUSD || 0)
          .minus(a.balanceInUSD || 0)
          .toNumber()
      );
  });

  const networkVersions = useAsyncData(
    "allNetworkVersions",
    async () => {
      if (!safeAddress.value) return;

      const promises = availableNetworks.map(async (network) => {
        const obj = {
          ...network,
        } as NetworkVersion;

        try {
          const wallet = GaslessWallet__factory.connect(
            safeAddress.value,
            getRpcProvider(network.chainId)
          );

          const forwarderProxyContract = Forwarder__factory.connect(
            forwarderProxyAddress,
            getRpcProvider(network.chainId)
          );

          const latestVersion = await forwarderProxyContract.avoWalletVersion(
            "0x0000000000000000000000000000000000000001"
          );

          const currentVersion = await wallet.DOMAIN_SEPARATOR_VERSION();

          obj.latestVersion = latestVersion;
          obj.currentVersion = currentVersion;

          return obj;
        } catch (e) {
          // console.log(e);
          obj.notdeployed = true;

          obj.latestVersion = "0.0.0";
          obj.currentVersion = "0.0.0";
          return obj;
        }
      });

      const results = await Promise.allSettled(promises);

      const arr = results
        .map((result) => {
          if (result.status === "fulfilled") {
            return result.value;
          }
        })
        .filter(Boolean);

      return arr as NetworkVersion[];
    },
    {
      immediate: true,
      watch: [safeAddress],
    }
  );

  onMounted(async () => {
    await wait(1000);

    await fetchGasBalance();
  });

  const fetchBalances = async () => {
    if (!safeAddress.value) return;
    if (documentVisibility.value === "hidden") return;
    // if (balanceAborter.value) balanceAborter.value.abort();

    try {
      balances.value.loading = true;
      // balanceAborter.value = new AbortController();


      const data = await Promise.all(availableNetworks.map(async network => {
        const customTokenAddress = customTokens.value
          .filter((t) => String(t.chainId) == String(network.chainId))
          .map((t) => t.address);

        try {
          return await getChainBalances(String(network.chainId), safeAddress.value, [
            ...tokens.value.filter(t => t.chainId === String(network.chainId)).map((t) => t.address),
            ...customTokenAddress,
          ])

        } catch (error) {
          try {
            const params: any = {
              address: safeAddress.value,
              customTokens: customTokenAddress
            };

            const resp = await http(`/api/${network.chainId}/balances`, {
              signal: balanceAborter.value?.signal,
              params,
            });

            return resp as any[]
          } catch (error) {
            notify({ type: 'warning', message: `Failed to fetch balances on ${chainIdToName(network.chainId)}` })
            return []
          }
        }
      }))


      balanceAborter.value = undefined;

      balances.value.data = data.flat().sort((a, b) => toBN(a.balanceInUSD).gt(b.balanceInUSD) ? 1 : -1);
      balances.value.error = null;

      return balances.value.data
    } catch (e: any) {
      const err = parseTransactionError(e);
      if (err?.parsed.includes("abort")) return;

      balances.value.error = e;
      throw e;
    } finally {
      balances.value.loading = false;
    }
  };

  const fetchGasBalance = async () => {
    if (!account.value) return;

    try {
      pending.value.gasBalance = true;
      const b = await avoProvider.getBalance(account.value).then(toBN);

      gasBalance.value = b.div(10 ** 18).toFixed();
    } finally {
      pending.value.gasBalance = false;
    }
  };

  useIntervalFn(fetchGasBalance, 15000, {
    immediate: true,
  });

  useIntervalFn(fetchBalances, 15000);

  watch(
    [account],
    async () => {
      try {
        pending.value.global = true;
        safeAddress.value = undefined;
        fetchGasBalance();
        await fetchSafeddress();
      } finally {
        pending.value.global = false;
      }
    },
    { immediate: true }
  );

  watch([safeAddress, account, tokens], () => {
    fetchBalances();
  });

  return {
    gasBalance,
    safeAddress,
    tokenBalances,
    totalBalance,
    fetchGasBalance,
    pending,
    balances,
    fetchBalances,
    forwarderProxyAddress,
    networkVersions,
    networkPreference,
    avoProvider,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot));
}
