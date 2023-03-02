<script setup lang="ts">
import { utils } from "ethers";
import {
  GaslessWallet__factory,
  Forwarder__factory,
  AvoFactoryProxy__factory,
} from "@/contracts";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";

const emit = defineEmits(["destroy"]);

const { safeAddress, sendTransaction } = useAvocadoSafe();
const { forwarderProxyAddress } = useSafe();
const { parseTransactionError } = useErrorHandler();

const props = defineProps<{
  network: NetworkVersion;
}>();

const { account } = useWeb3();
const submitting = ref(false);

const avoWalletImpAddress = ref("");

const fetchAvowalletImpl = async () => {
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

  avoWalletImpAddress.value = avoWalletImpl;
  return avoWalletImpl;
};

const { data: txData } = useAsyncData(
  "upgrade-tx",
  async () => {
    await fetchAvowalletImpl();

    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      getRpcProvider(props.network.chainId)
    );

    const data = await wallet.populateTransaction.upgradeTo(
      avoWalletImpAddress.value
    );

    return data;
  },
  {
    immediate: true,
  }
);

const { pending, data, error } = useEstimatedFee(txData, {
  chainId: String(props.network.chainId),
});

const handleSubmit = async () => {
  try {
    submitting.value = true;

    const metadata = encodeUpgradeMetadata({
      version: utils.formatBytes32String(props.network.latestVersion || ""),
      walletImpl: avoWalletImpAddress.value,
    });

    const transactionHash = await sendTransaction(
      {
        data: txData.value?.data,
        chainId: props.network.chainId,
        to: safeAddress.value,
      },
      {
        metadata,
      }
    );

    emit("destroy");

    await showPendingTransactionModal(
      transactionHash!,
      props.network.chainId,
      "upgrade",
      true
    );

    refreshNuxtData("allNetworkVersions");

    logActionToSlack({
      action: "upgrade",
      chainId: String(props.network.chainId),
      account: account.value,
      message: `Upgraded to ${props.network.latestVersion}`,
    });
  } catch (e) {
    openSnackbar({
      message: parseTransactionError(e),
      type: "error",
    });

    logActionToSlack({
      type: "error",
      action: "upgrade",
      chainId: String(props.network.chainId),
      account: account.value,
      message: parseTransactionError(e),
    });
  } finally {
    submitting.value = false;
  }
};

onUnmounted(() => {
  clearNuxtData("upgrade-tx");
});
</script>

<template>
  <div class="text-center flex gap-7.5 flex-col">
    <div class="flex flex-col justify-center gap-7.5 items-center">
      <ChainLogo class="w-10 h-10" :chain="network.chainId" />
      <span class="text-lg leading-5"
        >{{ chainIdToName(network.chainId) }} Upgrade</span
      >
    </div>
    <div class="flex items-center justify-center gap-3">
      <span
        class="bg-slate-800 py-2 px-4 rounded-5 items-center justify-center flex text-sm"
      >
        v{{ network.currentVersion }}
      </span>
      <ArrowRight class="w-[18px] h-[18px] text-slate-400" />
      <span
        class="bg-slate-800 py-2 px-4 rounded-5 items-center justify-center flex text-sm"
      >
        v{{ network.latestVersion }}
      </span>
    </div>
    <EstimatedFee
      :chain-id="String(network.chainId)"
      :loading="pending"
      :data="data"
      :error="error"
    />
    <CommonButton
      :loading="pending || submitting"
      :disabled="pending || submitting || error || !txData"
      @click="handleSubmit"
      class="justify-center w-full"
      size="lg"
    >
      Upgrade
    </CommonButton>
  </div>
</template>
