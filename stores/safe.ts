import { ethers } from "ethers";
import { acceptHMRUpdate, defineStore, storeToRefs } from "pinia";
import {
  BalanceResolver,
  BalanceResolver__factory,
  Forwarder__factory,
} from "~/contracts";
import { RPC_URLS } from "~~/connectors";
import { IToken } from "./tokens";
import { collect } from "collect.js";
import { wait } from "@instadapp/utils";

export interface IBalance extends IToken {
  balance: string;
  balanceInUSD: string | null;
}

const balanceResolverAddresses: Record<string, string> = {
  "137": "0x58632D23120b20650262b8A629a14e4F4043E0D9",
  "42161": "0xca5f37e6D8bB24c5A7958d5eccE7Bd9Aacc944f2",
  "43114": "0x63009f31D054E0ac9F321Cf0D642375236A4Bf1E",
  "10": "0xca5f37e6D8bB24c5A7958d5eccE7Bd9Aacc944f2",
  "1": "0x5b7D61b389D12e1f5873d0cCEe7E675915AB5F43",
  "56": "0xb808cff38706e267067b0af427726aa099f69f89",
  "100": "0xfaa244e276b1597f663975ed007ee4ff70d27849",
};

const balanceResolverContracts = Object.keys(balanceResolverAddresses).reduce(
  (acc, curr) => {
    acc[curr] = BalanceResolver__factory.connect(
      balanceResolverAddresses[curr],
      getRpcProvider(curr)
    );
    return acc;
  },
  {} as Record<string, BalanceResolver>
);

const forwarderProxyAddress = "0x375F6B0CD12b34Dc28e34C26853a37012C24dDE5"; // ForwarderProxy
const forwarderProxyContract = Forwarder__factory.connect(
  forwarderProxyAddress,
  new ethers.providers.JsonRpcProvider(RPC_URLS[137])
);

export const useSafe = defineStore("safe", () => {
  console.log("defineStore::safe");
  const safeAddress = ref();

  const { account } = useWeb3();
  const { tokens } = storeToRefs(useTokens());
  const gasBalance = ref();
  const pending = ref<Record<string, boolean>>({
    gasBalance: false,
    balances: false,
    global: false,
  });

  const chainTokenBalances = ref<Record<string, IBalance[]>>({
    "137": [],
    "42161": [],
    "43114": [],
    "10": [],
    "1": [],
    "100": [],
    "56": [],
  });

  const tokenBalances = computed(() => {
    return Object.keys(chainTokenBalances.value)
      .reduce((acc, curr) => {
        const balances = chainTokenBalances.value[curr];

        return [...acc, ...balances];
      }, [] as IBalance[])
      .sort()
      .sort((a, b) => (toBN(a.balance).isGreaterThan(b.balance) ? -1 : 1))
      .sort((a, b) =>
        a.balanceInUSD && b.balanceInUSD
          ? toBN(a.balanceInUSD).isGreaterThan(b.balanceInUSD)
            ? -1
            : 1
          : 1
      );
  });

  const totalBalance = computed(() =>
    tokenBalances.value.reduce(
      (acc, curr) => acc.plus(curr.balanceInUSD || "0"),
      toBN(0)
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

  const fetchBalances = async (chainId: string) => {
    if (!safeAddress.value) {
      return [];
    }

    let newBalances: IBalance[] = [];

    const chainTokens = collect(
      tokens.value.filter((t) => t.chainId === chainId)
    );
    const chunkedTokens = chainTokens.chunk(chainId === "42161" ? 5 : 20).all();

    await Promise.allSettled(
      chunkedTokens.map(async (chunk: any[]) => {
        chunk = (chunk as any).all();

        const balances = await balanceResolverContracts[chainId].getBalances(
          safeAddress.value,
          chunk.map((t) => t.address)
        );

        for (let index = 0; index < balances.length; index++) {
          let token = chunk[index] as IToken;
          let balance = toBN(balances[index]).div(10 ** token.decimals);
            newBalances.push({
              ...token,
              balance: balance.toFixed(6, 1),
              balanceInUSD: token.price
                ? balance.times(token.price).toFixed(2)
                : null,
            });
        }
      })
    );

    return newBalances;
  };

  const fetchAllBalances = async () => {
    try {
      pending.value.balances = true;
      await Promise.allSettled(
        Object.keys(chainTokenBalances.value).map((chainId) =>
          fetchBalances(chainId).then(
            (r) => (chainTokenBalances.value[chainId] = r)
          )
        )
      );
    } finally {
      pending.value.balances = false;
    }
  };

  onMounted(async () => {
    await wait(1000);

    await Promise.allSettled([fetchGasBalance(), fetchAllBalances()]);
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

  useIntervalFn(fetchAllBalances, 10000, {
    immediate: true,
  });

  watch(
    [account],
    async () => {
      try {
        pending.value.global = true;
        safeAddress.value = undefined;
        fetchGasBalance();
        await fetchSafeddress();
        await fetchAllBalances();
      } finally {
        pending.value.global = false;
      }
    },
    { immediate: true }
  );

  return {
    chainTokenBalances,
    gasBalance,
    safeAddress,
    tokenBalances,
    totalBalance,
    fetchGasBalance,
    pending,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot));
}
