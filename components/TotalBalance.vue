<script setup>
import { storeToRefs } from 'pinia'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'

const { balances } = storeToRefs(useSafe())
const { totalBalance, tokenBalances } = useAvocadoSafe()
const { authorisedNetworks } = useAuthorities()

function hasAvailableTokens() {
  return tokenBalances.value.length > 0
}

function handleOpenSendModal() {
  const firstAvailableChain = authorisedNetworks.value[0]?.chainId || 1
  openSendModal(firstAvailableChain)
}
</script>

<template>
  <div>
    <h2 class="text-slate-400 text-sm font-semibold mb-2.5 flex items-center gap-2">
      Total balance

      <SvgSpinner v-if="balances.loading" class="text-primary" />
    </h2>
    <div class="font-semibold leading-10">
      <div v-if="!balances.data" class="h-10 w-40 flex items-center">
        <div class="loading-box rounded-[12px] w-full h-[34px]" />
      </div>
      <div v-else class="flex flex-col sm:flex-row sm:items-center sm:gap-7.5 gap-4">
        <span class="sm:text-[40px] text-[32px]">{{ formatUsd(totalBalance.toNumber()) }}</span>
        <div class="flex items-center gap-[15px]">
          <CommonButton
            color="white"
            class="flex-1 sm:flex-none items-center justify-center gap-2.5 h-10 !px-4"
            :disabled="!hasAvailableTokens()"
            @click="handleOpenSendModal"
          >
            Send
            <div
              class="rounded-full bg-primary p-1.5 text-white"
              :class="{
                'dark:bg-slate-600 bg-slate-300 dark:!text-slate-500 !text-slate-400':
                  !hasAvailableTokens(),
              }"
            >
              <ArrowRight class="-rotate-45 w-3.5 h-3.5" />
            </div>
          </CommonButton>
          <CommonButton
            color="white"
            class="flex-1 sm:flex-none items-center justify-center gap-2.5 h-10 !px-4"
            @click="openQrCode"
          >
            Receive
            <div
              class="rounded-full bg-primary p-1.5 text-white"
            >
              <ArrowRight class="rotate-[135deg] w-3.5 h-3.5" />
            </div>
          </CommonButton>
        </div>
      </div>
    </div>
  </div>
</template>
