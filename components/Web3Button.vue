<script setup lang="ts">
import { storeToRefs } from 'pinia'
import GasSVG from '~/assets/images/icons/gas.svg'
import PlusSVG from '~/assets/images/icons/plus.svg'
import PowerOnSVG from '~/assets/images/icons/power-on.svg'
import PowerOffSVG from '~/assets/images/icons/power-off.svg'

defineProps({
  hideGas: Boolean,
  hideEOA: Boolean,
  hidePower: Boolean,
})

const { active, deactivate, account, connector } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { gasBalance } = storeToRefs(useSafe())
const [hovered, toggle] = useToggle(false)
const { setConnectorName, cachedProviderName } = useConnectors()
const { providers } = useNetworks()

const ensName = ref()
const isActualActive = computed(() => {
  if (trackingAccount.value)
    return true
  return active.value
})

async function closeConnection() {
  const { success } = await openDisconnectWalletModal()

  if (success) {
    trackingAccount.value = ''
    setConnectorName(null)
    if (connector.value)
      deactivate()
  }
}

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
      class="dark:bg-slate-800 bg-slate-100 py-2.5 sm:py-3 leading-5 justify-between relative flex rounded-7.5 items-center px-4.5 sm:px-4 gap-x-2.5"
      @mouseenter="toggle(true)"
      @mouseleave="toggle(false)"
      @click="closeConnection"
    >
      <div v-if="connectedProvider">
        <component :is="connectedProvider.logo" class="h-7.5 sm:h-6 w-7.5 sm:w-6" />
      </div>
      <div class="flex flex-col items-start">
        <span class="block sm:hidden text-xs text-slate-500 text-slate-400">Owner's Address</span>
        <span>{{ addressLabel }}</span>
      </div>
      <div class="-my-3 -mx-3 w-12 h-12 hidden sm:flex items-center justify-center">
        <PowerOffSVG
          v-if="hovered"
          class="pointer-events-none right-0"
        />
        <PowerOnSVG v-else class="pointer-events-none right-0" />
      </div>
    </button>
  </div>
</template>
