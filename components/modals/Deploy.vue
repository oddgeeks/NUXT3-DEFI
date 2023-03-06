<script setup lang="ts">
import { emit } from "process";
import SVGWalletConnect from "~/assets/images/wallet/wallet-connect.svg?component";

const { networks } = useNetworks();
const { safeAddress } = useAvocadoSafe();

const availableNetworks = networks.filter((network) => network.chainId != 634);

const emit = defineEmits(["destroy"]);

interface NetworkDeployments extends Network {
  notdeployed: boolean;
}

const { data, pending } = useAsyncData(
  async () => {
    return Promise.all(
      availableNetworks.map(async (network) => {
        const provider = getRpcProvider(network.chainId);

        const code = await provider.getCode(safeAddress.value);

        return {
          ...network,
          notdeployed: code == "0x",
        };
      })
    );
  },
  {
    default: () => availableNetworks as NetworkDeployments[],
    watch:[safeAddress]
  }
);

function handleDeploy(network: Network) {
  emit("destroy");
  openDeployNetworkModal(network);
}
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <SVGWalletConnect class="mx-auto" />
    <div>
      <h1 class="text-lg leading-5 mb-3 text-center">
        Activate (Deploy) Wallet
      </h1>
      <h2 class="text-slate-400 text-xs font-medium leading-5 text-center">
        Some dapps might not work as expected if your wallet is not deployed.
        Wallet deployment happens on first transaction on each chain.
        <a class="text-primary">Learn more</a>
      </h2>
    </div>
    <ul class="grid grid-cols-2 gap-4">
      <li
        class="dark:bg-gray-850 flex items-center justify-between bg-slate-50 rounded-7.5 px-4 py-2.5"
        :key="network.chainId"
        v-for="network in data"
      >
        <div class="flex gap-3 items-center text-sm">
          <ChainLogo class="w-[26px] h-[26px]" :chain="network.chainId" />
          {{ network.name }}
        </div>
        <div
          v-if="pending"
          style="width: 80px; height: 30px"
          class="loading-box rounded-5"
        ></div>
        <CommonButton
          @click="handleDeploy(network)"
          :disabled="!network.notdeployed"
          v-else
          class="h-[30px] items-center px-[18px]"
          size="sm"
        >
          <span v-if="network.notdeployed"> Deploy </span>
          <span v-else>Deployed</span>
        </CommonButton>
      </li>
    </ul>
  </div>
</template>
