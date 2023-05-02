<script setup lang="ts">
import { storeToRefs } from 'pinia'
import GasSVG from '~/assets/images/icons/gas.svg'
import PlusSVG from '~/assets/images/icons/plus.svg'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg'

defineProps({
  hideGas: Boolean,
  hideEOA: Boolean,
})

const { active, account } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { gasBalance } = storeToRefs(useSafe())
const { cachedProviderName } = useConnectors()
const { providers } = useNetworks()

const ensName = ref()
const isActualActive = computed(() => {
  if (trackingAccount.value)
    return true
  return active.value
})

const pendingGasAmount = useNuxtData('pending-deposit')

const addressLabel = computed(() =>
  trackingAccount.value
    ? `Tracking: ${shortenHash(account.value, 4)}`
    : ensName.value || shortenHash(account.value, 4),
)

const connectedProvider = computed(() => {
  return providers.find(item => item.id === cachedProviderName.value)
})

whenever(
  account,
  async () => {
    ensName.value = await getRpcProvider(1).lookupAddress(account.value)
  },
  { immediate: true },
)
</script>

<template>
  <CommonButton v-show="!isActualActive" size="lg" @click="openWeb3Modal">
    Connect
  </CommonButton>
  <div v-show="isActualActive" class="flex items-center gap-[14px]">
    <button
      v-if="!hideGas"
      class="px-4 py-[9px] flex items-center justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2"
      @click="openTopUpGasModal()"
    >
      <GasSVG
        class="transition-colors"
        :class="
          toBN(pendingGasAmount.data.value).gt('0')
            ? 'text-orange-400'
            : 'text-slate-400'
        "
      />

      <span
        v-if="gasBalance"
        :class="{
          'text-orange-400': toBN(pendingGasAmount.data.value).gt('0'),
        }"
        class="whitespace-nowrap transition-colors leading-5"
      >
        {{ formatDecimal(gasBalance, 2) }} USDC</span>

      <div v-else class="loading-box rounded-5 w-20 h-5" />

      <span
        class="h-[26px] w-[26px] flex items-center justify-center bg-primary rounded-full text-white"
      ><PlusSVG /></span>
    </button>

    <button
      v-if="!hideEOA"
      class="hidden sm:flex dark:bg-slate-800 bg-slate-100 py-3 leading-5 justify-between relative rounded-7.5 items-center px-4 gap-x-2.5"
      @click="openSidebar"
    >
      <div v-if="connectedProvider">
        <component :is="connectedProvider.logo" class="h-6 w-6" />
      </div>
      {{ addressLabel }}
      <ChevronDownSVG class="hidden sm:flex w-3.5 h-3.5 pointer-events-none -rotate-90 text-slate-400" />
    </button>

    <div
      v-if="!hideEOA"
      class="sm:hidden dark:bg-slate-800 bg-slate-100 py-3 leading-5 justify-between relative flex rounded-7.5 items-center px-4 gap-x-2.5"
    >
      <div v-if="connectedProvider">
        <component :is="connectedProvider.logo" class="h-6 w-6" />
      </div>
      <div class="flex flex-col">
        <span class="text-slate-500 text-xs text-left">Owner's address</span>
        <span>{{ addressLabel }}</span>
      </div>
      <ChevronDownSVG class="hidden sm:flex w-3.5 h-3.5 pointer-events-none -rotate-90 text-slate-400" />
    </div>
  </div>
</template>
