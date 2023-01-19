<script setup>
import LinkSVG from "~/assets/images/icons/external-link.svg?raw";
import SVGX from "~/assets/images/icons/x.svg?component";
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
const { networks, getNetworkByChainId } = useNetworks();
const { tokenBalances } = useAvocadoSafe();

useForceSingleSession()

const isHideZeroBalances = useLocalStorage("hide-zero-balances", false);
const networkPreference = useLocalStorage("network-preference", "all");

const availableNetworks = computed(() =>
  [...new Set(tokenBalances.value.map((token) => token.chainId))]
  .map(i => networks.find(n => n.chainId == i)))

</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1 md:pb-2">
    <TotalBalance />
    <DApps />
    <div class="flex gap-5 lg:flex-row flex-col flex-1">
      <div class="flex flex-col w-full gap-5">
        <div class="flex justify-between pr-7.5">
         <div class="flex gap-7.5">
           <h2 class="font-semibold inline-flex gap-2.5 items-center">
            Balances
            <button
              @click="
                openDialogModal({
                  type: 'question',
                  title: 'Avocado Wallet Balances',
                  isButtonVisible: false,
                  content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href='https://help.avocado.link/en/getting-started/topping-up-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-blue-500'>Learn more about how to deposit ${LinkSVG}</a>
          `,
                })
              "
            >
              <QuestionCircleSVG class="w-5 h-5" />
            </button>
          </h2>
          <ClientOnly>
            <button
              :class="{ 'dark:text-white text-slate-900': isHideZeroBalances }"
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
            <Menu as="div" class="relative z-20 flex gap-4 items-center">
            <div v-if="networkPreference !== 'all' && tokenBalances.length" class="p-2.5 flex items-center gap-[6px] leading-[10px] text-xs dark:bg-slate-800 bg-slate-100 rounded-5">
               {{ getNetworkByChainId(networkPreference).name }}
             <button @click="networkPreference = 'all'">
               <SVGX class="w-2.5 h-2.5 text-slate-400"/>
             </button>
            </div>
            <MenuButton class="text-sm flex items-center gap-2 h-7.5">
              All Networks
              <ChevronDownSVG class="text-slate-400 w-[14px] h-[14px]" />
            </MenuButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-out"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <MenuItems as="ul" class="absolute w-[220px] left-1/2 border-2 rounded-5 p-[6px] -translate-x-1/2 bg-slate-50 dark:bg-gray-850 top-8 border-slate-150 dark:border-slate-700">
                <MenuItem @click="networkPreference = 'all'" class="flex items-center gap-2.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer text-sm py-2.5 px-3 rounded-[14px]" as="li">
                 <ChainLogo style="width: 22px;height: 22px"/>
                All Networks
                <CheckCircle v-if="networkPreference == 'all'" class="success-circle w-5 ml-auto" />
               </MenuItem>

                <MenuItem @click="networkPreference = String(network.chainId)" class="flex items-center gap-2.5 hover:bg-slate-150 hover:dark:bg-slate-800 cursor-pointer text-sm py-2.5 px-3 rounded-[14px]" as="li" v-for="network in availableNetworks">
                  <ChainLogo style="width: 22px;height: 22px" :chain="network.chainId"/>
                  {{ network.name }}
                  <CheckCircle v-if="networkPreference == network.chainId" class="success-circle w-5 ml-auto" />
               </MenuItem>

              </MenuItems>
            </transition>
          </Menu>
        </div>
        <Balances :networkPreference="networkPreference" :hideZeroBalances="isHideZeroBalances" />
      </div>
      <div class="flex lg:flex-col md:shrink-0 md:basis-[213px] gap-5">
        <div class="w-full flex flex-col gap-5">
          <h2 class="font-semibold inline-flex gap-2.5">
            Your Avocado Wallet
            <button
              @click="
                openDialogModal({
                  type: 'question',
                  title: 'Your Wallet',
                  isButtonVisible: false,
                  content: `Deposit or receive funds by scanning or copying your Avocado Wallet QR code. You can deposit or receive from any supported chains.
          <br><br>
          <a href='https://help.avocado.link/en/getting-started/topping-up-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-blue-500'>Learn more about how to deposit ${LinkSVG}</a>
          `,
                })
              "
            >
              <QuestionCircleSVG class="w-5 h-5" />
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
