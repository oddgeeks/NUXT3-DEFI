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

const connect = async (closeModal: Function, provider: any) => {
  try {
    loading.value[provider.name] = true;
    await activate(await provider.connect(), undefined, true);
    setConnectorName(provider.id);
    closeModal();
  } catch (e) {
    console.log(e);
  } finally {
    loading.value[provider.name] = false;
  }
};

const closeConnection = () => {
  trackingAccount.value = null;
  setConnectorName(null);
  if (connector) {
    deactivate();
  }
};
</script>

<template>
  <CommonInlineModal containerClass="md:max-w-[364px] rounded-full shadow-2xl">
    <template #reveal="{ openModal }">
      <CommonButton size="lg" @click="openModal" v-show="!active">
        Connect
      </CommonButton>
    </template>
    <template v-slot="{ closeModal }">
      <div class="relative dark:bg-gray-950 bg-white rounded-[30px] px-12 py-10 text-center">
        <button class="absolute h-7.5 w-7.5 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100 top-0 right-0 m-6" @click="closeModal" aria-label="Close modal">
           <SVGX />
        </button>
        <div class="flex flex-col items-center justify-center mb-7 gap-4">
          <span class="text-lg">Connect wallet</span>
        </div>

        <ul class="grid gap-[15px] px-2 pb-2">
          <li :key="provider.name" v-for="provider in providers">
            <button
              @click="connect(closeModal, provider)"
              class="px-5 py-4 w-full dark:bg-gray-850 bg-slate-100 rounded-[40px] group transition-colors flex items-center gap-4"
              :class="
                provider.name === 'Metamask'
                  ? 'dark:hover:bg-[#282125] hover:bg-[#FEF1E8]'
                  : 'dark:hover:bg-[#15233C] hover:bg-[#EBF2FE]'
              "
            >
              <div class="flex items-center flex-1 gap-5">
                <component :is="provider.logo" />

                <span class="text-[16px]">{{ provider.name }}</span>
              </div>

                <svg
                 v-if="loading[provider.name]"
                  :class="
                    provider.name === 'Metamask'
                      ? 'text-orange-500'
                      : 'text-blue-500'
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
                      : 'group-hover:text-blue-500'
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
    </template>
  </CommonInlineModal>

  <div v-show="active" class="flex items-center gap-[14px]">
    <button
      class="px-4 py-[9px] flex items-center justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2"
      @click="openTopUpGasModal()"
    >
      <GasSVG class="text-slate-400" />

      <span class="whitespace-nowrap leading-5">
        {{ formatDecimal(gasBalance, 2) }} USDC</span
      >

      <span
        class="h-[26px] w-[26px] flex items-center justify-center bg-blue-500 rounded-full text-white"
        ><PlusSVG
      /></span>
    </button>

    <span v-tippy="{ placement: 'bottom-end', content: trackingAccount? `Tracking: ${shortenHash(account)}` : shortenHash(account) }">
      <button
        @mouseenter="toggle(true)"
        @mouseleave="toggle(false)"
        @click="closeConnection"
        class="dark:bg-slate-800 bg-slate-100 py-[9px] h-[44px] w-[44px] relative flex text-white rounded-[30px] items-center justify-center px-4 gap-x-3"
      >
        <PowerOffSVG v-if="hovered" class="absolute pointer-events-none" />
        <PowerOnSVG v-else class="absolute pointer-events-none" />
      </button>
    </span>
  </div>
</template>
