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
    <h2 class="mb-2.5 flex items-center gap-2 font-semibold text-slate-400">
      Total balance

      <SvgSpinner v-if="balances.loading" class="text-primary" />
    </h2>
    <div class="font-semibold leading-10">
      <div v-if="!balances.data" class="flex h-10 w-40 items-center">
        <div class="loading-box h-[34px] w-full rounded-[12px]" />
      </div>
      <div v-else class="flex flex-row gap-4 sm:items-center sm:gap-7.5">
        <span class="flex-1 text-[32px] sm:text-[40px] md:flex-none">{{ formatUsd(totalBalance.toNumber()) }}</span>
        <div class="flex items-center gap-[15px] md:hidden">
          <button
            class="h-10"
            :disabled="!hasAvailableTokens()"
            @click="openSendModal(1)"
          >
            <div
              class="rounded-full bg-primary p-1.5 text-white"
              :class="{
                'bg-slate-300 !text-slate-400 dark:bg-slate-600 dark:!text-slate-500':
                  !hasAvailableTokens(),
              }"
            >
              <ArrowRight class="h-3.5 w-3.5 -rotate-45" />
            </div>
          </button>
          <button
            class="h-10"
            @click="openQrCode"
          >
            <div
              class="rounded-full bg-primary p-1.5 text-white"
            >
              <ArrowRight class="h-3.5 w-3.5 rotate-[135deg]" />
            </div>
          </button>
        </div>
        <div class="hidden items-center gap-[15px] md:flex">
          <CommonButton
            color="white"
            class="h-10 flex-1 items-center justify-center gap-2.5 !px-4 sm:flex-none"
            :disabled="!hasAvailableTokens()"
            @click="handleOpenSendModal"
          >
            Send
            <CommonTxTypeIcon class="p-1.5" :disabled="!hasAvailableTokens()" color="light">
              <template #icon>
                <SvgoArrowRight class="h-3.5 w-3.5 -rotate-45" />
              </template>
            </CommonTxTypeIcon>
          </CommonButton>

          <CommonButton
            color="white"
            class="h-10 flex-1 items-center justify-center gap-2.5 !px-4 sm:flex-none"
            @click="openQrCode"
          >
            Receive
            <div
              class="rounded-full bg-primary p-1.5 text-white"
            >
              <ArrowRight class="h-3.5 w-3.5 rotate-[135deg]" />
            </div>
          </CommonButton>
        </div>
      </div>
    </div>
  </div>
</template>
