<script setup lang="ts">
import { storeToRefs } from "pinia";
import SVGX from "~/assets/images/icons/x.svg?component";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import PowerOnSVG from "~/assets/images/icons/power-on.svg?component";
import PowerOffSVG from "~/assets/images/icons/power-off.svg?component";

const { active, activate, deactivate, account, connector } = useWeb3();
const { trackingAccount } = useAccountTrack();
const { gasBalance } = storeToRefs(useSafe());
const [hovered, toggle] = useToggle(false);

const { providers } = useNetworks();
const { setConnectorName } = useConnectors();

const loading = ref<Record<string, boolean>>({});

const [showWeb3Modal, toggleWeb3Modal] = useToggle(false);

const ensName = ref();

const isActualActive = computed(() => {
  if (trackingAccount.value) return true;
  return active.value;
});

const connect = async (provider: any) => {
  try {
    loading.value[provider.name] = true;
    await activate(await provider.connect(), undefined, true);
    setConnectorName(provider.id);
    toggleWeb3Modal(false);
  } catch (e) {
    console.log(e);
  } finally {
    loading.value[provider.name] = false;
  }
};

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

const isProviderVisible = (provider: Provider) => {
  if (provider.name === "Metamask" && !window.ethereum) return false;
  return true;
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
  <CommonButton size="lg" @click="toggleWeb3Modal()" v-show="!isActualActive">
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
  <Modal inline @destroy="toggleWeb3Modal(false)" :show="showWeb3Modal">
    <div class="relative">
      <div class="flex flex-col items-center justify-center mb-7 gap-4">
        <span class="text-lg">Connect wallet</span>
      </div>

      <ul class="grid gap-[15px] px-2 pb-2">
        <li :key="provider.name" v-for="provider in providers">
          <button
            v-if="isProviderVisible(provider)"
            @click="connect(provider)"
            class="px-5 py-[15px] w-full dark:bg-gray-850 bg-slate-100 rounded-[40px] group transition-colors flex items-center gap-4"
            :class="
              provider.name === 'Metamask'
                ? 'dark:hover:bg-[#282125] hover:bg-[#FEF1E8]'
                : 'dark:hover:bg-[#15233C] hover:bg-[#EBF2FE]'
            "
          >
            <div class="flex items-center flex-1 gap-[15px]">
              <component class="h-7.5 w-7.5" :is="provider.logo" />

              <span class="text-[16px]">{{ provider.name }}</span>
            </div>

            <svg
              v-if="loading[provider.name]"
              :class="
                provider.name === 'Metamask'
                  ? 'text-orange-500'
                  : 'text-primary'
              "
              class="animate-spin -ml-1 mr-3 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>

            <svg
              v-else
              class="transition-all text-slate-500"
              :class="
                provider.name === 'Metamask'
                  ? 'group-hover:text-orange-500'
                  : 'group-hover:text-primary'
              "
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.75 9H14.25"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M9 3.75L14.25 9L9 14.25"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </li>
      </ul>
    </div>
  </Modal>
</template>
