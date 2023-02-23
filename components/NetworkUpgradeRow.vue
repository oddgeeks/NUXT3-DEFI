<script setup lang="ts">
import { lt } from "semver";
import {
  GaslessWallet__factory,
  Forwarder__factory,
  AvoFactoryProxy__factory,
} from "@/contracts";
import { storeToRefs } from "pinia";

const props = defineProps<{
  network: NetworkVersion;
}>();

const { account } = useWeb3();
const { forwarderProxyAddress } = useSafe();
const { gasBalance } = storeToRefs(useSafe());
const { safeAddress, safe } = useAvocadoSafe();
const { parseTransactionError } = useErrorHandler();
const { switchNetworkByChainId } = useNetworks();

const provider = getRpcProvider(634);

const pending = ref(false);

const isUpgradeAvailable = computed(() =>
  lt(props.network.currentVersion, props.network.latestVersion)
);

const isBalaceNotEnough = computed(() => {
  if (!estimatedFee.value) return false;
  return toBN(gasBalance.value).lt(estimatedFee.value?.max!);
});

const getTx = async () => {
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

  return wallet.populateTransaction.upgradeTo(avoWalletImpl);
};

const estimatedFee = asyncComputed(async () => {
  if (!isUpgradeAvailable.value) return;

  const txData = await getTx();

  const message = await safe.value?.generateSignatureMessage(
    [txData],
    +props.network.chainId
  );

  const feeData = await provider.send("txn_estimateFeeWithoutSignature", [
    message,
    account.value,
    props.network.chainId,
  ]);

  return calculateEstimatedFee({
    chainId: props.network.chainId,
    ...feeData,
  });
});

const handleUpgrade = async (network: NetworkVersion) => {
  try {
    await switchNetworkByChainId(634);

    pending.value = true;

    const txData = await getTx();

    const { success } = await openUpgradeModal(network.chainId, txData);

    if (!success) return;

    const tx = await safe.value?.sendTransaction({
      to: safeAddress.value,
      data: txData.data,
      chainId: network.chainId,
    });

    await showPendingTransactionModal(
      tx?.hash!,
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
  } catch (e) {
    console.log(e);
    notify({
      type: "error",
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
      <div
        v-if="!estimatedFee && isUpgradeAvailable"
        class="loading-box w-24 mt-2 h-4 mx-auto rounded-lg"
      ></div>
      <div class="flex mt-2 text-slate-400" v-else-if="estimatedFee">
        <span
          :class="{ 'text-red-alert': isBalaceNotEnough }"
          class="text-xs inline-flex items-center gap-2.5"
        >
          Txn Fees: {{ estimatedFee.formatted }} USDC
        </span>
      </div>
    </td>
  </tr>
</template>
