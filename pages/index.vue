<script setup>
import LinkSVG from "~/assets/images/icons/external-link.svg?raw";
import CheckCircle from "~/assets/images/icons/check-circle.svg?component";
import QuestionCircleSVG from "~/assets/images/icons/question-circle.svg?component";
const { safeAddress } = useAvocadoSafe();

const isHideZeroBalances = useLocalStorage("hide-zero-balances", false);
</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1 md:pb-10">
    <TotalBalance />
    <DApps />
    <div class="flex gap-5 lg:flex-row flex-col flex-1">
      <div class="flex flex-col w-full gap-5">
        <div class="flex gap-7.5">
          <h2 class="font-semibold inline-flex gap-2.5">
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
        <Balances :hideZeroBalances="isHideZeroBalances" />
      </div>
      <div class="flex flex-col md:shrink-0 md:basis-[213px] gap-5">
        <div class="w-full flex flex-col gap-5">
          <h2 class="font-semibold inline-flex gap-2.5">
            Your Wallet
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
