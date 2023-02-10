import { ethers } from "ethers";
import { acceptHMRUpdate, defineStore, storeToRefs } from "pinia";
import {
  Forwarder__factory,
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
  const safeAddress = ref();

  const { account } = useWeb3();
  const { tokens } = storeToRefs(useTokens());

  const gasBalance = ref();
  const pending = ref<Record<string, boolean>>({
    gasBalance: false,
    balances: false,
    global: false,
  });

  const tokenBalances = ref<IBalance[]>([])
  const apiBalances = ref<any[]>([])

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
  const fetchAllBalances = async () => {
    try {
      if (!safeAddress.value) {
        return
      }

      apiBalances.value = await $fetch("/api/balances", {
        params: {
          address: safeAddress.value
        }
      })
    } finally {
    }
  };

  const updateSafeBalances = async () => {
    try {
      if (!safeAddress.value) {
        return
      }

      if (!tokens.value) {
        return
      }

      if (!tokens.value.length) {
        return
      }

      pending.value.balances = true;

      tokenBalances.value = tokens.value.map((tb) => {
        const tokenBalance: IBalance = {
          ...tb,
          balance: '0',
          balanceInUSD: '0'
        }
        const balance = apiBalances.value.find(b => b.address.toLowerCase() === tb.address.toLowerCase() && tb.chainId === b.chainId);

        if (balance) {
          tokenBalance.balance = balance.balance
          tokenBalance.balanceInUSD = balance.balanceInUSD
        }

        return tokenBalance
      })
        .filter(b => b.price !== 0)
        .sort((a, b) => toBN(b.balanceInUSD || 0).minus(a.balanceInUSD || 0).toNumber());
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

  useIntervalFn(fetchAllBalances, 15000, {
    immediate: true,
  });

  useIntervalFn(updateSafeBalances, 10000, {
    immediate: true,
  });

  watch(
    [safeAddress],
    async () => {
      await fetchAllBalances();
      await updateSafeBalances();
    },
    { immediate: true }
  );

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
