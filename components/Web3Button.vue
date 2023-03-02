<script setup lang="ts">
import { storeToRefs } from "pinia";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import PowerOnSVG from "~/assets/images/icons/power-on.svg?component";
import PowerOffSVG from "~/assets/images/icons/power-off.svg?component";

const { active, deactivate, account, connector } = useWeb3();
const { trackingAccount } = useAccountTrack();
const { gasBalance } = storeToRefs(useSafe());
const [hovered, toggle] = useToggle(false);
const { setConnectorName } = useConnectors();

const ensName = ref();
const isActualActive = computed(() => {
  if (trackingAccount.value) return true;
  return active.value;
});

const closeConnection = async () => {
  const { success } = await openDisconnectWalletModal();

  if (success) {
    trackingAccount.value = "";
    setConnectorName(null);
    if (connector.value) {
      deactivate();
    }
  }
};

const addressLabel = computed(() =>
  trackingAccount.value
    ? `Tracking: ${shortenHash(account.value, 4)}`
    : ensName.value || shortenHash(account.value, 4)
);

whenever(
  account,
  async () => {
    ensName.value = await getRpcProvider(1).lookupAddress(account.value);
  },
  { immediate: true }
);
</script>

<template>
  <CommonButton size="lg" @click="openWeb3Modal" v-show="!isActualActive">
    Connect
  </CommonButton>
  <div v-show="isActualActive" class="flex items-center gap-[14px]">
    <button
      class="px-4 py-[9px] flex items-center justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2"
      @click="openTopUpGasModal()"
    >
      <GasSVG class="text-slate-400" />

      <span v-if="gasBalance" class="whitespace-nowrap leading-5">
        {{ formatDecimal(gasBalance, 2) }} USDC</span
      >

      <div v-else class="loading-box rounded-5 w-20 h-5"></div>

      <span
        class="h-[26px] w-[26px] flex items-center justify-center bg-primary rounded-full text-white"
        ><PlusSVG
      /></span>
    </button>

    <button
      @mouseenter="toggle(true)"
      @mouseleave="toggle(false)"
      @click="closeConnection"
      class="dark:bg-slate-800 bg-slate-100 py-3 leading-5 justify-between pr-12 relative flex rounded-7.5 items-center px-4 gap-x-3"
    >
      {{ addressLabel }}
      <PowerOffSVG
        v-if="hovered"
        class="pointer-events-none absolute right-0"
      />
      <PowerOnSVG v-else class="pointer-events-none absolute right-0" />
    </button>
  </div>
</template>
