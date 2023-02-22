<script setup lang="ts">
import { lt } from "semver";
import {
  GaslessWallet__factory,
  Forwarder__factory,
  AvoFactoryProxy__factory,
} from "@/contracts";

defineProps<{
  network: NetworkVersion;
}>();

const { forwarderProxyAddress } = useSafe();
const { safeAddress, safe } = useAvocadoSafe();

const pending = ref(false);

const upgradeAvailable = (currentVersion: string, latestVersion: string) => {
  return lt(currentVersion, latestVersion);
};

const handleUpgrade = async (network: NetworkVersion) => {
  try {
    pending.value = true;
    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      getRpcProvider(network.chainId)
    );

    const forwarderProxyContract = Forwarder__factory.connect(
      forwarderProxyAddress,
      getRpcProvider(network.chainId)
    );

    const avoFactory = await forwarderProxyContract.avoFactory();

    const avoFactoryProxyContract = AvoFactoryProxy__factory.connect(
      avoFactory,
      getRpcProvider(network.chainId)
    );

    const avoWalletImpl = await avoFactoryProxyContract.avoWalletImpl();

    const { data } = await wallet.populateTransaction.upgradeTo(avoWalletImpl);

    const tx = await safe.value?.sendTransaction({
      to: safeAddress.value,
      data,
      chainId: network.chainId,
    });

    await showPendingTransactionModal(
      tx?.hash!,
      network.chainId,
      "upgrade",
      true
    );

    refreshNuxtData("allNetworkVersions");

    console.log(tx);
  } catch (e) {
    console.log(e);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <tr>
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
        :loading="pending"
        @click="handleUpgrade(network)"
        class="w-full text-center justify-center"
      >
        Update Now
      </CommonButton>
      <CommonButton
        v-else
        :disabled="true"
        class="!px-[19px] w-full items-center justify-center"
      >
        Already up to date
      </CommonButton>
    </td>
  </tr>
</template>
