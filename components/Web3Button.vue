<script setup lang="ts">
import SVGX from "~/assets/images/icons/x.svg?component";
import SVGLogout from "~/assets/images/icons/logout.svg?component";
import SVGArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import { storeToRefs } from "pinia";

defineProps({
  buttonClass: {
    type: String,
  },
  buttonOnly: {
    type: Boolean,
  }
})
const { active, activate, deactivate, account, connector } = useWeb3();
const { gasBalance } = storeToRefs(useSafe());

const { providers } = useNetworks();

const connect = async (closeModal: Function, provider: any) => {
  await activate(await provider.connect());
  closeModal();
};

const closeConnection = () => {
  if (connector) {
    deactivate();
  }
};
</script>

<template>
  <CommonModal containerClass="md:max-w-[364px] rounded-full shadow-2xl">
    <template #reveal="{ openModal }">
      <button v-show="!active" class="w-full bg-slate-800 text-white rounded-[20px] py-2.5 px-4" :class="buttonClass"
        @click="openModal">
        Connect
      </button>
    </template>
    <template v-slot="{ closeModal }">
      <div class="relative bg-[#111827] rounded-[30px] px-12 py-10 text-center">
        <button class="absolute top-0 right-0 m-6" @click="closeModal" aria-label="Close modal">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="30" height="30" rx="15" fill="#1E293B" />
            <path d="M18.5 11.5L11.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M11.5 11.5L18.5 18.5" stroke="white" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </button>
        <div class="flex flex-col items-center justify-center mb-7 gap-4">
          <span class="text-lg">Connect wallet</span>

          <span class="text-center text-slate-400 text-xs leading-5 font-medium">
            By connecting your wallet, you agree to our
            <a href="#" class="font-semibold text-blue-500">Terms of Service</a>
            and our
            <a href="#" class="font-semibold text-blue-500">Privacy Policy</a>
          </span>
        </div>

        <ul class="grid gap-[15px] px-2 pb-2">
          <li :key="provider.name" v-for="provider in providers">
            <button @click="connect(closeModal, provider)"
              class="p-5 w-full bg-gray-850 rounded-[40px] group hover:!bg-opacity-10 hover:text-white transition-colors flex items-center gap-5 text-slate-400"
              :class="
                provider.name === 'Metamask'
                  ? 'hover:bg-orange-50'
                  : 'hover:bg-blue-50'
              ">
              <div class="flex items-center flex-1 gap-5">
                <component :is="provider.logo" />

                <span class="text-white text-[16px]" :class="
                  provider.name === 'Metamask'
                    ? 'group-hover:text-orange-500'
                    : 'group-hover:text-blue-500'
                ">{{ provider.name }}</span>
              </div>

              <svg class="transition-all text-blue-400 transform group-hover:translate-x-1" :class="
                provider.name === 'Metamask'
                  ? 'group-hover:text-orange-500'
                  : 'group-hover:text-blue-500'
              " width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.75 9H14.25" stroke="#64748B" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M9 3.75L14.25 9L9 14.25" stroke="#64748B" stroke-width="2" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </template>
  </CommonModal>
  <button v-show="(active && !buttonOnly)" @click="closeConnection"
    class="w-full bg-slate-800 text-white rounded-[30px] text-white inline-flex items-center justify-between px-4 py-1.5 gap-3.5 ">
    <div class="flex items-center space-x-2">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M0 10C0 4.47715 4.47715 0 10 0H15C17.7614 0 20 2.23858 20 5V10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10Z"
          fill="#7AD66C" />
        <path
          d="M15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10Z"
          fill="#1E293B" />
      </svg>


      <span>{{ gasBalance }} GAS</span>
    </div>

    <span class="flex items-center justify-between gap-3.5 font-semibold">

      <div class="flex flex-row items-center gap-2.5 py-1.5 px-3 bg-slate-600 rounded-[30px] leading-5">
        {{ shortenHash(account) }}
      </div>

      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0_2790_3225)">
          <path
            d="M5.25 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V2.91667C1.75 2.60725 1.87292 2.3105 2.09171 2.09171C2.3105 1.87292 2.60725 1.75 2.91667 1.75H5.25"
            stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M9.33301 9.91659L12.2497 6.99992L9.33301 4.08325" stroke="#94A3B8" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12.25 7H5.25" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </g>
        <defs>
          <clipPath id="clip0_2790_3225">
            <rect width="14" height="14" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </span>
  </button>
</template>
