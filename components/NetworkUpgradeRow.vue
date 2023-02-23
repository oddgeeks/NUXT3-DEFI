<script setup lang="ts">
import { utils } from "ethers";
import { lt } from "semver";
import {
  GaslessWallet__factory,
  Forwarder__factory,
  AvoFactoryProxy__factory,
} from "@/contracts";

const props = defineProps<{
  network: NetworkVersion;
}>();

const { account } = useWeb3();
const { forwarderProxyAddress } = useSafe();
const { safeAddress, safe, sendTransaction } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();
const { switchNetworkByChainId } = useNetworks();

const pending = ref(false);

const isUpgradeAvailable = computed(() =>
  lt(props.network.currentVersion, props.network.latestVersion)
);

const handleUpgrade = async (network: NetworkVersion) => {
  try {
    await switchNetworkByChainId(634);

    pending.value = true;

    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      getRpcProvider(props.network.chainId)
    );

    const forwarderProxyContract = Forwarder__factory.connect(
      forwarderProxyAddress,
      getRpcProvider(props.network.chainId)
    );

    const avoFactory = await forwarderProxyContract.avoFactory();

    const avoFactoryProxyContract = AvoFactoryProxy__factory.connect(
      avoFactory,
      getRpcProvider(props.network.chainId)
    );

    const avoWalletImpl = await avoFactoryProxyContract.avoWalletImpl();

    const txData = await wallet.populateTransaction.upgradeTo(avoWalletImpl);

    const { success } = await openUpgradeModal(network.chainId, txData, {
      currentVersion: network.currentVersion,
      latestVersion: network.latestVersion,
    });

    if (!success) return;

    const metadata = encodeUpgradeMetadata({
      version: utils.formatBytes32String(network.latestVersion || ""),
      walletImpl: avoWalletImpl,
    });

    const transactionHash = await sendTransaction(
      {
        data: txData.data,
        chainId: props.network.chainId,
        to: safeAddress.value,
      },
      {
        metadata,
      }
    );

    await showPendingTransactionModal(
      transactionHash!,
      network.chainId,
      "upgrade",
      true
    );

    refreshNuxtData("allNetworkVersions");

    logActionToSlack({
      action: "upgrade",
      chainId: String(network.chainId),
      account: account.value,
      message: `Upgraded to ${network.latestVersion}`,
    });

    notify({
      type: "success",
      message: "Upgrade successful",
    });
  } catch (e) {
    console.log(e);
    notify({
      type: "error",
      message: parseTransactionError(e),
    });

    logActionToSlack({
      type: "error",
      action: "upgrade",
      chainId: String(network.chainId),
      account: account.value,
      message: parseTransactionError(e),
    });
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
        v-if="isUpgradeAvailable"
        :loading="pending"
        @click="handleUpgrade(network)"
        class="w-full text-center justify-center"
      >
        Upgrade Now
      </CommonButton>
      <CommonButton
        v-else
        :disabled="true"
        class="!px-[19px] w-full items-center justify-center"
      >
        <span v-if="network.currentVersion === '0.0.0'">Not deployed yet</span>
        <span v-else>Already up to date</span>
      </CommonButton>
    </td>
  </tr>
</template>
