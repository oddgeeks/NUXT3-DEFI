import { ethers } from "ethers";
import { acceptHMRUpdate, defineStore, storeToRefs } from "pinia";
import {
  GaslessWallet__factory,
  Forwarder__factory,
  AvoFactoryProxy__factory,
} from "~/contracts";
import { RPC_URLS } from "~~/connectors";
import { IToken } from "./tokens";
import { wait } from "@instadapp/utils";

export interface IBalance extends IToken {
  balance: string;
  balanceInUSD: string | null;
}

const forwarderProxyAddress = "0x375F6B0CD12b34Dc28e34C26853a37012C24dDE5"; // ForwarderProxy
const forwarderProxyContract = Forwarder__factory.connect(
  forwarderProxyAddress,
  new ethers.providers.JsonRpcProvider(RPC_URLS[137])
);

export const useSafe = defineStore("safe", () => {
  // balance aborter
  const balanceAborter = ref<AbortController>();
  const safeAddress = ref();

  const { account } = useWeb3();
  const { tokens } = storeToRefs(useTokens());
  const documentVisibility = useDocumentVisibility();
  const { networks } = useNetworks();

  const availableNetworks = networks.filter(
    (network) => network.chainId != 634
  );

  const gasBalance = ref();
  const pending = ref<Record<string, boolean>>({
    gasBalance: false,
    balances: false,
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

  const { data: apiBalances, refresh: refreshApiBalances } = useAsyncData(
    "api-balances",
    async (context) => {
      if (!safeAddress.value) {
        return;
      }

      if (documentVisibility.value === "hidden") {
        const memory = context?.payload.data["api-balances"];
        return memory;
      }

      if (balanceAborter.value) {
        balanceAborter.value.abort();
      }

      balanceAborter.value = new AbortController();

      const balances = (await $fetch("/api/balances", {
        signal: balanceAborter.value?.signal,
        params: {
          address: safeAddress.value,
        },
      })) as any[];

      balanceAborter.value = undefined;

      return balances;
    },
    {
      server: false,
      immediate: true,
      watch: [safeAddress, account, tokens],
    }
  );

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
        const balance = apiBalances.value?.find(
          (b: any) =>
            b.address.toLowerCase() === tb.address.toLowerCase() &&
            tb.chainId === b.chainId
        );

        if (balance) {
          tokenBalance.balance = balance.balance;
          tokenBalance.balanceInUSD = balance.balanceInUSD;
        }

        return tokenBalance;
      })
      .sort((a, b) =>
        toBN(b.balanceInUSD || 0)
          .minus(a.balanceInUSD || 0)
          .toNumber()
      );
  });

  useAsyncData(
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

  const avoProvider = getRpcProvider(634);

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

  useIntervalFn(refreshApiBalances, 15000);

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

  return {
    gasBalance,
    safeAddress,
    tokenBalances,
    totalBalance,
    fetchGasBalance,
    pending,
    apiBalances,
    forwarderProxyAddress,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot));
}
