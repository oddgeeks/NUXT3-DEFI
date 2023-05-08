<script setup lang="ts">
import { storeToRefs } from 'pinia'
import LinkSVG from '~/assets/images/icons/external-link.svg?raw'
import CheckCircle from '~/assets/images/icons/check-circle.svg'
import QuestionCircleSVG from '~/assets/images/icons/question-circle.svg'

const { account } = useWeb3()
const { unstableDappNetworks } = useBanner()
const { safeAddress } = useAvocadoSafe()
const { networkPreference } = storeToRefs(useSafe())

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const isHideZeroBalances = useLocalStorage('hide-zero-balances', false)

function handleOpenDialog() {
  openDialogModal({
    type: 'question',
    title: 'Avocado Wallet Balances',
    isButtonVisible: false,
    content: `These are your Avocado Wallet Balances, not your EOA balances. Deposit funds into your Avocado Wallet to begin using Avocado.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
  })
}
</script>

<template>
  <div class="container flex flex-col gap-[30px] flex-1">
    <TotalBalance />
    <div class="flex flex-col gap-3.5">
      <DApps />
      <YourWallet />
    </div>
    <div class="flex gap-5 lg:flex-row flex-col flex-1">
      <div class="flex relative flex-col w-full gap-5">
        <div class="flex flex-col gap-5">
          <WarningsUnstableDappVersion v-if="unstableDappNetworks.length" />
          <div class="flex justify-between sm:pr-7.5">
            <div class="flex gap-7.5">
              <h2 class="font-semibold inline-flex gap-2.5 items-center">
                Balances
                <button v-if="account" @click="handleOpenDialog">
                  <QuestionCircleSVG class="w-5 h-5 text-primary" />
                </button>
              </h2>
              <ClientOnly v-if="account">
                <button
                  :class="{
                    'dark:text-white text-slate-900': isHideZeroBalances,
                  }"
                  class="text-sm text-slate-400 hidden sm:inline-flex gap-2.5 items-center"
                  @click="isHideZeroBalances = !isHideZeroBalances"
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

            <MultipleNetworkFilter v-if="account" v-model:networks="networkPreference" />
          </div>
          <Balances
            :hide-zero-balances="isHideZeroBalances"
          />
        </div>
        <div
          v-if="!account"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 sm:-translate-y-1/2 flex items-center justify-center w-full"
        >
          <div class="flex flex-col items-center justify-center gap-6">
            <p
              class="font-semibold leading-[30px] text-slate-400 sm:text-white sm:text-lg sm:whitespace-nowrap text-center"
            >
              Connect your wallet to see the balances
            </p>

            <div class="w-28">
              <Web3Button />
            </div>
          </div>
        </div>
      </div>
      <div
        class="hidden sm:flex lg:flex-col md:shrink-0 md:basis-[213px] lg:mt-0 mt-16 gap-5"
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
                  content: `Deposit or receive funds by scanning or copying your Avocado Wallet QR code. Your Avocado wallet is fundamentally linked to your wallet address making (EOA) you the true owner of it.
          <br><br>
          <a href='https://help.avocado.instadapp.io/en/articles/7038878-depositing-funds-to-your-avocado-account' target='blank' rel='noopener noreferrer' class='text-sm font-medium inline-flex gap-2.5 text-primary'>Learn more about how to deposit ${LinkSVG}</a>
          `,
                })
              "
            >
              <QuestionCircleSVG v-if="account" class="w-5 h-5 text-primary" />
            </button>
          </h2>
          <QrCode />
        </div>
        <div class="w-full flex flex-col gap-5">
          <h2 class="font-semibold inline-flex gap-2.5">
            Supported Chains
          </h2>
          <SupportedChains
            :account="safeAddress"
            class="p-5 dark:bg-gray-850 bg-slate-50 rounded-5.5"
          />
        </div>
      </div>
    </div>
  </div>
</template>
