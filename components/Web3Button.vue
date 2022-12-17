<script setup lang="ts">
import { storeToRefs } from "pinia";

const { active, activate, deactivate, account, connector } = useWeb3();
const { gasBalance } = storeToRefs(useSafe());

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
      <CommonButton @click="openModal" v-show="!active"> Connect </CommonButton>
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

          <!-- <span class="text-center text-slate-400 text-xs leading-5 font-medium">
            By connecting your wallet, you agree to our
            <a href="#" class="font-semibold text-blue-500">Terms of Service</a>
            and our
            <a href="#" class="font-semibold text-blue-500">Privacy Policy</a>
          </span> -->
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

  <button v-show="active" @click="closeConnection"
    class="w-full bg-slate-800 text-white rounded-[30px] inline-flex items-center justify-between px-4 gap-x-3">
    <div class="flex items-center space-x-2">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="10" height="16" rx="2" stroke="#94A3B8" stroke-width="2" />
        <rect x="5.5" y="9.5" width="3" height="1" rx="0.5" stroke="#94A3B8" />
        <rect x="5.5" y="13.5" width="3" height="1" rx="0.5" stroke="#94A3B8" />
        <path
          d="M13 10H14.5C15.0523 10 15.5 10.4477 15.5 11V16C15.5 16.5523 15.9477 17 16.5 17H17.5C18.0523 17 18.5 16.5523 18.5 16V2.5"
          stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>


      <span>{{ formatDecimal(gasBalance, 2) }} USDC</span>
    </div>

    <span class="flex items-center justify-between gap-x-3 font-semibold py-1.5">
      <div class="flex flex-row items-center gap-2 py-1.5 pl-2.5 pr-3 bg-slate-600 rounded-[30px] leading-5">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 9C0 4.02944 4.02944 0 9 0H13.5C15.9853 0 18 2.01472 18 4.5V9C18 13.9706 13.9706 18 9 18C4.02944 18 0 13.9706 0 9Z"
            fill="#7AD66C" />
          <path
            d="M13 9C13 11.2091 11.2091 13 9 13C6.79086 13 5 11.2091 5 9C5 6.79086 6.79086 5 9 5C11.2091 5 13 6.79086 13 9Z"
            fill="#475569" />
        </svg>

        <span>{{ shortenHash(account) }}</span>
      </div>

      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_2790_3225)">
          <path
            d="M5.25 12.25H2.91667C2.60725 12.25 2.3105 12.1271 2.09171 11.9083C1.87292 11.6895 1.75 11.3928 1.75 11.0833V2.91667C1.75 2.60725 1.87292 2.3105 2.09171 2.09171C2.3105 1.87292 2.60725 1.75 2.91667 1.75H5.25"
            stroke="#94A3B8"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M9.33301 9.91659L12.2497 6.99992L9.33301 4.08325"
            stroke="#94A3B8"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M12.25 7H5.25"
            stroke="#94A3B8"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
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
