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
  buttonClass: String,
})

const { active, deactivate, account, connector } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { gasBalance } = storeToRefs(useSafe())
const { resetAccounts } = useSafe()
const { setConnectorName, cachedProviderName } = useConnectors()
const { providers } = useNetworks()
const router = useRouter()

const ensName = ref()
const open = ref(false)
const hovered = ref(false)

const isActualActive = computed(() => {
  if (trackingAccount.value)
    return true
  return active.value
})

async function closeConnection() {
  const { success } = await openDisconnectWalletModal()

  if (success) {
    resetAccounts()
    open.value = false
    setConnectorName(null)
    userSignOut()
    if (connector.value)
      deactivate()
  }
}

const pendingGasAmount = useNuxtData('pending-deposit')

const addressLabel = computed(() =>
  trackingAccount.value
    ? `Tracking: ${shortenHash(trackingAccount.value, 4)}`
    : ensName.value || shortenHash(account.value, 4),
)

const connectedProvider = computed(() => {
  return providers.find(item => item.id === cachedProviderName.value)
})

function userSignOut() {
  router.push('/login')
}

whenever(
  account,
  async () => {
    ensName.value = await getRpcProvider(1).lookupAddress(account.value)
  },
  { immediate: true },
)
</script>

<template>
  <CommonButton v-show="!isActualActive" :class="buttonClass" size="lg" @click="openWeb3Modal">
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
      ><PlusSVG />
      </span>
    </button>
    <template v-if="!hideEOA">
      <Popover
        as="div" class="relative z-30 gap-4 items-center flex"
      >
        <PopoverButton class="bg-slate-100 relative rounded-7.5 dark:bg-slate-800 py-2.5 sm:py-3 px-4.5 sm:px-4 leading-5 justify-between flex items-center gap-x-2.5">
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

          <SvgoChevronDown class="shrink-0" />
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
            v-slot="{ close }"
            as="div"
            class="bg-slate-100 sm:w-[440px] top-0 flex-col leading-5 justify-between flex gap-x-2.5 dark:bg-gray-850 absolute right-0 ring-1 dark:ring-slate-750 ring-slate-150 rounded-[25px]"
          >
            <div class="w-full flex justify-between p-5">
              <div class="flex gap-[14px]">
                <div class="flex items-center gap-2.5">
                  <div v-if="connectedProvider">
                    <component :is="connectedProvider.logo" class="h-7.5 sm:h-9 w-7.5 sm:w-9" />
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
                @click.stop="close"
              >
                <SvgoX />
              </button>
            </div>
            <div class="border-t dark:border-slate-750 px-5 pb-5 border-slate-150 pt-4">
              <WalletItemList />
            </div>
          </PopoverPanel>
        </transition>
      </Popover>
    </template>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
