<script setup lang="ts">
import { lt } from "semver";
import { GaslessWallet__factory } from "@/contracts";
const { networks } = useNetworks();
const availableNetworks = networks.filter((network) => network.chainId != 634);

// Latest Implementation Version: 2.0.0
const avoWalletLatestImplementationAddress =
  "0x3718f4bf9140f333bca79cb279f09f0bb8e6ddee";

const { safeAddress, safe } = useAvocadoSafe();
const { forwarderProxyContract } = useSafe();

const { data: allNetworks, pending } = useAsyncData(
  "allNetworkVersions",
  async () => {
    if (!safeAddress.value) return;

    const promises = availableNetworks.map(async (network) => {
      try {
        const obj = {
          ...network,
        } as NetworkVersion;
        const wallet = GaslessWallet__factory.connect(
          safeAddress.value,
          getRpcProvider(network.chainId)
        );

        const latestVersion = await forwarderProxyContract.avoWalletVersion(
          "0x0000000000000000000000000000000000000001"
        );

        const currentVersion = await wallet.DOMAIN_SEPARATOR_VERSION();

        console.log({
          latestVersion: latestVersion,
          currentVersion: currentVersion,
          chain: network.chainId,
          name: network.name,
        });

        obj.latestVersion = latestVersion;
        obj.currentVersion = currentVersion;

        return obj;
      } catch (e) {
        console.log(e);
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

const upgradeAvailable = (currentVersion: string, latestVersion: string) => {
  return lt(currentVersion, latestVersion);
};

const handleUpgrade = async (network: NetworkVersion) => {
  try {
    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      getRpcProvider(network.chainId)
    );

    const { data } = await wallet.populateTransaction.upgradeTo(
      avoWalletLatestImplementationAddress
    );

    const tx = await safe.value?.sendTransaction({
      to: safeAddress.value,
      data,
      chainId: network.chainId,
    });

    console.log(tx);
  } catch (e) {
    console.log(e);
  }
};
</script>

<template>
  <div class="mx-auto max-w-[880px] w-full flex-1">
    <div class="mb-7.5 max-w-[796px] w-full">
      <h1 class="text-3xl font-bold leading-10 mb-2.5">
        Upgrade Avocado’s Smart Contracts 🧠
      </h1>
      <h2 class="text-slate-400 font-medium text-sm">
        Avocado wallet is a Smart Contract wallet, it is recommended that you
        keep your Smart Contract upgraded to make the most of Avocado.
      </h2>
    </div>
    <div class="dark:bg-gray-850 bg-slate-50 rounded-[25px] flex-1">
      <table class="table w-full">
        <thead>
          <tr
            class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
          >
            <th class="text-left py-6 pl-7.5">Network</th>
            <th class="py-5">Latest version</th>
            <th class="py-5 text-center">
              <span class="opacity-0">Action</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
          <tr :key="network.chainId" v-for="network in allNetworks">
            <td class="py-[26px] pl-7.5">
              <div class="flex gap-3 items-center">
                <ChainLogo class="w-11 h-11" :chain="network.chainId" />
                <div class="flex flex-col gap-1">
                  <span>
                    {{ network.name }}
                  </span>
                  <span class="text-slate-400 font-medium text-sm">
                    {{ network.currentVersion }}
                  </span>
                </div>
              </div>
            </td>
            <td>
              <span>
                {{ network.latestVersion }}
              </span>
            </td>
            <td class="pr-7.5 w-[221px]">
              <CommonButton
                v-if="
                  upgradeAvailable(
                    network.currentVersion || '0.0.0',
                    network.latestVersion || '0.0.0'
                  )
                "
                @click="handleUpgrade(network)"
                class="w-full text-center justify-center"
              >
                Update Now
              </CommonButton>
              <CommonButton
                v-else
                class="!px-[19px] w-full items-center justify-center"
                :disabled="true"
              >
                Already up to date
              </CommonButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
