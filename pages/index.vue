<script setup lang="ts">
import LinkSVG from "~/assets/images/icons/external-link.svg?raw";
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
const { networks, getNetworkByChainId } = useNetworks();
const { tokenBalances } = useAvocadoSafe();
const { account } = useWeb3();

useForceSingleSession();

const availableNetworks = networks.filter((network) => network.chainId != 634);

const isHideZeroBalances = useLocalStorage("hide-zero-balances", false);
const networkPreference = useLocalStorage<Set<number>>("preference-networks", new Set(availableNetworks.map(el => el.chainId)));

const handleOpenDialog = () => {
  openDialogModal({
    type: "question",
    title: "Avocado Wallet Balances",
    isButtonVisible: false,
    content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/getting-started/topping-up-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
  });
};
</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1">
    <TotalBalance />
    <DApps />
    <div class="flex gap-5 lg:flex-row flex-col flex-1">
      <div class="flex relative flex-col w-full gap-5">
        <div
          :class="{ 'blur pointer-events-none': !account }"
          class="flex flex-col gap-5"
        >
          <div class="flex justify-between pr-7.5">
            <div class="flex gap-7.5">
              <h2 class="font-semibold inline-flex gap-2.5 items-center">
                Balances
                <button @click="handleOpenDialog">
                  <QuestionCircleSVG class="w-5 h-5 text-primary" />
                </button>
              </h2>
              <ClientOnly>
                <button
                  :class="{
                    'dark:text-white text-slate-900': isHideZeroBalances,
                  }"
                  @click="isHideZeroBalances = !isHideZeroBalances"
                  class="text-sm text-slate-400 inline-flex gap-2.5 items-center"
                >
                  Hide 0 Balances

                  <CheckCircle
                    :class="[
                      { 'success-circle text-white': isHideZeroBalances },
                      { 'svg-circle darker': !isHideZeroBalances },
                    ]"
                    class="w-4 h-4"
                  />
                </button>
              </ClientOnly>
            </div>
            <div class="flex items-center space-x-4">
              <div class="flex align-self-end items-center" v-if="networkPreference.size > 0">
                <ChainLogo
                  v-for="network in Array.from(networkPreference).slice(0, 3)"
                  style="width: 22px; height: 22px"
                  class="-ml-2 first:ml-0"
                  stroke="2"
                  :chain="network"
                />
                <div
                  v-if="networkPreference.size > 3"
                  style="width: 22px; height: 22px"
                  class="bg-green-500 rounded-full text-xs flex items-center justify-center -ml-2 border border-2 dark:border-slate-900 border-gray-50"
                >
                  {{ networkPreference.size - 3 }}
                </div>
              </div>
              <Popover as="div" class="relative z-20 flex gap-4 items-center">
                <PopoverButton class="text-sm flex items-center gap-2 h-7.5">
                  All Networks
                  <ChevronDownSVG class="text-slate-400 w-[14px] h-[14px]" />
                </PopoverButton>
                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-out"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <PopoverPanel
                    as="ul"
                    class="absolute w-[220px] left-1/2 border-2 rounded-5 p-[6px] -translate-x-1/2 bg-slate-50 dark:bg-gray-850 top-8 border-slate-150 dark:border-slate-700"
                  >
                    <li
                      class="flex items-center justify-between gap-2.5 text-sm py-1 px-3 rounded-[14px]"
                    >
                      <span class="text-slate-400">Networks</span>
                      <div
                        @click="networkPreference = new Set(availableNetworks.map(el => el.chainId))"
                        class="text-green-600 cursor-pointer"
                      >
                        All
                      </div>
                    </li>

                    <li
                      @click="networkPreference.has(network.chainId) ? networkPreference.delete(network.chainId) : networkPreference.add(network.chainId)"
                      class="flex items-center gap-2.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer text-sm py-2.5 px-3 rounded-[14px]"
                      v-for="network in availableNetworks"
                    >
                      <ChainLogo
                        style="width: 22px; height: 22px"
                        :chain="network.chainId"
                      />
                      {{ network.name }}
                      <CheckCircle
                        v-if="networkPreference.has(network.chainId)"
                        class="success-circle cursor-pointer w-5 ml-auto"
                      />
                      <CheckCircle
                        v-else
                        class="svg-circle darker cursor-pointer w-5 ml-auto"
                      />
                    </li>
                  </PopoverPanel>
                </transition>
              </Popover>
            </div>
          </div>
          <Balances
            :networkPreference="networkPreference"
            :hideZeroBalances="isHideZeroBalances"
          />
        </div>
        <div
          v-if="!account"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        >
          <div class="flex flex-col items-center justify-center gap-6">
            <p class="font-semibold text-lg whitespace-nowrap">
              Connect your wallet to see the balances
            </p>

            <div class="w-28">
              <Web3Button />
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex lg:flex-col md:shrink-0 md:basis-[213px] lg:mt-0 mt-16 gap-5"
      >
        <div class="w-full flex flex-col gap-5">
          <h2 class="font-semibold inline-flex gap-2.5">
            Your Avo Wallet
            <button
              @click="
                openDialogModal({
                  type: 'question',
                  title: 'Your Avocado Wallet',
                  isButtonVisible: false,
                  content: `Deposit or receive funds from <a class='text-primary' target='blank' rel='noopener noreferrer' href='https://help.avocado.instadapp.io/en/info/supported-chains'>any supported chain</a> by scanning or copying your Avocado Wallet QR code.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/getting-started/topping-up-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
                })
              "
            >
              <QuestionCircleSVG class="w-5 h-5 text-primary" />
            </button>
          </h2>
          <QrCode />
        </div>
        <div class="w-full flex flex-col gap-5">
          <h2 class="font-semibold inline-flex gap-2.5">Supported Chains</h2>
          <SupportedChains />
        </div>
      </div>
    </div>
  </div>
</template>
