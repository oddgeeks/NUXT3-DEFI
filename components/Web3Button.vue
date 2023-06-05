<script setup lang="ts">
import { storeToRefs } from 'pinia'
import GasSVG from '~/assets/images/icons/gas.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import PowerOnSVG from '~/assets/images/icons/power-on.svg?component'
import PowerOffSVG from '~/assets/images/icons/power-off.svg?component'

defineProps({
  hideGas: Boolean,
  hideEOA: Boolean,
  hidePower: Boolean,
})

const { active, deactivate, account, connector } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { gasBalance } = storeToRefs(useSafe())
const open = ref(false)
const hovered = ref(false)
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
    open.value = false
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
    <template v-if="!hideEOA">
      <button
        :class="open ? 'opacity-0 pointer-events-none' : 'opacity-100'"
        class="bg-slate-100 relative rounded-7.5 dark:bg-slate-800 py-2.5 sm:py-3 px-4.5 sm:px-4 transition-all leading-5 justify-between flex items-center gap-x-2.5"
        @click="open = true"
      >
        <div class="flex gap-[14px]">
          <div class="flex items-center gap-2.5">
            <div v-if="connectedProvider">
              <component :is="connectedProvider.logo" class="h-7.5 sm:h-6 w-7.5 sm:w-6" />
            </div>
            <div class="flex flex-col items-start gap-[6px]">
              <span>{{ addressLabel }}</span>
            </div>
          </div>
        </div>

        <SvgoChevronDown class="-rotate-90 shrink-0" />
      </button>

      <div :class="open ? 'opacity-100 sm:w-[440px]' : 'opacity-0 sm:w-[213px] pointer-events-none'" class="bg-slate-100 transition-all leading-5 justify-between flex items-center gap-x-2.5 dark:bg-gray-850 absolute right-0 p-5 ring-1 dark:ring-slate-750 ring-slate-150 rounded-[25px]">
        <div class="flex gap-[14px]">
          <div class="flex items-center gap-2.5">
            <div v-if="connectedProvider">
              <component :is="connectedProvider.logo" class="h-7.5 sm:h-6 w-7.5 sm:w-6" />
            </div>
            <div class="flex flex-col items-start gap-[6px]">
              <span class="text-xs text-slate-400 leading-[10px]">Owner's Address</span>
              <span class="text-lg leading-5">{{ addressLabel }}</span>
            </div>
          </div>
          <button
            @click="closeConnection"
            @mouseenter="hovered = true"
            @mouseleave="hovered = false"
          >
            <div class="-my-3 -mx-3 w-12 h-12 hidden sm:flex items-center justify-center">
              <PowerOffSVG
                v-if="hovered"
                class="pointer-events-none right-0"
              />
              <PowerOnSVG v-else class="pointer-events-none right-0" />
            </div>
          </button>
        </div>
        <button
          class="h-7.5 w-7.5 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
          aria-label="Close EOA"
          @click.stop=" open = false"
        >
          <SvgoX />
        </button>
      </div>
    </template>
  </div>
</template>
