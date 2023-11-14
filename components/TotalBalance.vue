<script setup lang="ts">
import { storeToRefs } from 'pinia'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg?component'

const { balances, safeAddress } = storeToRefs(useSafe())
const { totalNetAssets } = storeToRefs(useDefi())
const { totalBalance } = useAvocadoSafe()
const { authorisedNetworks } = useAuthorities()
const { sessions } = storeToRefs(useWalletConnectV2())

function handleOpenSendModal() {
  const firstAvailableChain = authorisedNetworks.value[0]?.chainId || 1
  openSendModal(firstAvailableChain)
}
</script>

<template>
  <div class="flex flex-col gap-2.5 rounded-5 bg-gray-850 px-4 py-[14px] sm:flex-row sm:p-5">
    <div class="flex flex-1 flex-col gap-1 sm:gap-2.5">
      <h2 class="flex items-center gap-2 text-xs text-gray-400 sm:text-sm">
        Total balance

        <SvgSpinner v-if="balances.loading" class="text-primary" />
      </h2>
      <div class="font-semibold leading-10">
        <div v-if="!balances.data" class="flex h-10 w-40 items-center">
          <div class="loading-box h-[34px] w-full rounded-[12px]" />
        </div>
        <div v-else class="flex flex-row gap-4 sm:items-center">
          <span class="text-[30px] sm:flex-1 sm:text-[40px] md:flex-none">{{ formatUsd(totalBalance.toNumber()) }}</span>
          <div class="flex items-center gap-2.5 sm:gap-[15px]">
            <button
              v-tippy="'Send'"
              color="white"
              @click="handleOpenSendModal()"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
              >
                <ArrowRight class="h-3.5 w-3.5 -rotate-45" />
              </div>
            </button>

            <button
              v-tippy="'Receive'"
              color="white"
              @click="openQrCode"
            >
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white"
              >
                <ArrowRight class="h-3.5 w-3.5 rotate-[135deg]" />
              </div>
            </button>
          </div>
        </div>
      </div>
      <NuxtLink v-if="gt(totalNetAssets, 3)" to="/defi" class="w-fit text-left text-xs text-primary sm:text-sm">
        DeFi Balance: {{ formatUsd(totalNetAssets) }}
      </NuxtLink>
    </div>
    <div class="flex flex-col items-baseline gap-2.5 sm:flex-row">
      <button class="flex items-center gap-2 px-4 py-2 text-sm text-gray-400" @click="openTransactionShortcutsModal">
        <SvgoBookmark />
        Tx Shortcuts
      </button>
      <CommonButton
        v-if="!sessions.length"
        :disabled="!safeAddress"
        class="flex w-full items-center justify-center gap-2 !px-4 sm:w-fit"
        @click="openWalletConnectModal()"
      >
        <SVGWalletConnect />
        Connect
      </CommonButton>
    </div>
  </div>
</template>
