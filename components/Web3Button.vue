<script setup lang="ts">
import { storeToRefs } from "pinia";
import GasSVG from "~/assets/images/icons/gas.svg?component";
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import PowerOnSVG from "~/assets/images/icons/power-on.svg?component";
import PowerOffSVG from "~/assets/images/icons/power-off.svg?component";

const { active, activate, deactivate, account, connector } = useWeb3();
const { gasBalance } = storeToRefs(useSafe());
const [hovered, toggle] = useToggle(false)

const { providers } = useNetworks();

const connect = async (closeModal: Function, provider: any) => {
  await activate(await provider.connect(), undefined, true);
  closeModal();
};

const closeConnection = () => {
  if (connector) {
    deactivate();
  }
};
</script>

<template>
  <CommonInlineModal containerClass="md:max-w-[364px] rounded-full shadow-2xl">
    <template #reveal="{ openModal }">
      <CommonButton size="lg" @click="openModal" v-show="!active"> Connect </CommonButton>
    </template>
    <template v-slot="{ closeModal }">
      <div class="relative bg-[#111827] rounded-[30px] px-12 py-10 text-center">
        <button
          class="absolute top-0 right-0 m-6"
          @click="closeModal"
          aria-label="Close modal"
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="30" height="30" rx="15" fill="#1E293B" />
            <path
              d="M18.5 11.5L11.5 18.5"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <path
              d="M11.5 11.5L18.5 18.5"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div class="flex flex-col items-center justify-center mb-7 gap-4">
          <span class="text-lg">Connect wallet</span>
        </div>

        <ul class="grid gap-[15px] px-2 pb-2">
          <li :key="provider.name" v-for="provider in providers">
            <button
              @click="connect(closeModal, provider)"
              class="px-5 py-4 w-full bg-gray-850 rounded-[40px] group transition-colors flex items-center gap-4"
              :class="
                provider.name === 'Metamask'
                  ? 'hover:bg-[#282125]'
                  : 'hover:bg-[#15233C]'
              "
            >
              <div class="flex items-center flex-1 gap-5">
                <component :is="provider.logo" />

                <span class="text-white text-[16px]">{{ provider.name }}</span>
              </div>

              <svg
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
      class="px-4 py-[9px] flex items-center justify-between rounded-5 bg-slate-800 gap-2"
      @click="openTopUpGasModal()"
    >
      <GasSVG />

      <span class="whitespace-nowrap leading-5">
        {{ formatDecimal(gasBalance, 2) }} USDC</span
      >

      <span
        class="h-[26px] w-[26px] flex items-center justify-center bg-blue-500 rounded-full"
        ><PlusSVG
      /></span>
    </button>

    <span
     v-tippy="{ placement : 'bottom-end', content: shortenHash(account) }">
      <button
      @mouseenter="toggle(true)"
      @mouseleave="toggle(false)"
      @click="closeConnection"
      class="bg-slate-800 py-[9px] h-[44px] w-[44px] relative flex text-white rounded-[30px] items-center justify-center px-4 gap-x-3"
    >
     <PowerOffSVG v-if="hovered" class="absolute pointer-events-none" />
     <PowerOnSVG v-else class="absolute pointer-events-none" />
    </button>
    </span>
    
  </div>
</template>
