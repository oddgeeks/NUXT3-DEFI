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
const { gasBalance, ensName } = storeToRefs(useSafe())
const { resetAccounts } = useSafe()
const { setConnectorName, cachedProviderName } = useConnectors()
const { terminateMFAToken } = useMfa()
const { providers } = useNetworks()
const router = useRouter()

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
    terminateMFAToken()
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
</script>

<template>
  <CommonButton v-show="!isActualActive" :class="buttonClass" size="lg" @click="openWeb3Modal">
    Connect
  </CommonButton>
  <div v-show="isActualActive" class="flex items-center gap-[14px]">
    <button
      v-if="!hideGas"
      class="flex items-center justify-between gap-2 rounded-5 bg-slate-100 px-4 py-[9px] dark:bg-slate-800"
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
        class="whitespace-nowrap leading-5 transition-colors"
      >
        {{ formatDecimal(gasBalance, 2) }} USDC</span>

      <div v-else class="loading-box h-5 w-20 rounded-5" />

      <span
        class="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-white"
      ><PlusSVG />
      </span>
    </button>
    <template v-if="!hideEOA">
      <Popover
        as="div" class="relative z-30 flex items-center gap-4"
      >
        <PopoverButton class="relative flex items-center justify-between gap-x-2.5 rounded-7.5 bg-slate-100 px-4.5 py-2.5 leading-5 dark:bg-slate-800 sm:px-4 sm:py-3">
          <div class="flex gap-[14px]">
            <div class="flex items-center gap-2.5">
              <div v-if="connectedProvider">
                <component :is="connectedProvider.logo" class="h-7.5 w-7.5 sm:h-6 sm:w-6" />
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
            class="absolute right-0 top-0 flex flex-col justify-between gap-x-2.5 rounded-[25px] bg-slate-100 leading-5 ring-1 ring-slate-150 dark:bg-gray-850 dark:ring-slate-750 sm:w-[440px]"
          >
            <div class="flex w-full justify-between p-5">
              <div class="flex gap-[14px]">
                <div class="flex items-center gap-2.5">
                  <div v-if="connectedProvider">
                    <component :is="connectedProvider.logo" class="h-7.5 w-7.5 sm:h-9 sm:w-9" />
                  </div>
                  <div class="flex flex-col items-start gap-[6px]">
                    <span class="text-xs font-medium leading-[10px] text-slate-500">Owner's Address</span>
                    <span class="text-lg font-semibold leading-5">{{ addressLabel }}</span>
                  </div>
                </div>

                <button
                  class="flex h-7.5 w-7.5 items-center justify-center overflow-hidden rounded-full bg-slate-150 dark:bg-slate-800"
                  aria-label="Copy EOA"
                >
                  <Copy :text="trackingAccount || account" :icon-only="true" />
                </button>

                <button
                  class="flex h-7.5 w-7.5 items-center justify-center overflow-hidden rounded-full bg-slate-150 dark:bg-slate-800"
                  aria-label="Close Connection"
                  @click="closeConnection"
                  @mouseenter="hovered = true"
                  @mouseleave="hovered = false"
                >
                  <div class="absolute overflow-hidden">
                    <PowerOffSVG v-if="hovered" class="pointer-events-none h-12 w-12" />
                    <PowerOnSVG v-else class="pointer-events-none h-12 w-12" />
                  </div>
                </button>
              </div>
              <button
                class="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-150 dark:bg-slate-800"
                aria-label="Close EOA"
                @click.stop="close"
              >
                <SvgoX />
              </button>
            </div>
            <div class="border-t border-slate-150 px-5 pb-5 pt-4 dark:border-slate-750">
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
