<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Tippy } from 'vue-tippy'
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

const [DefineTemplate, DisconnectButton] = createReusableTemplate()

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
  <DefineTemplate>
    <div
      class="relative flex h-7.5 w-7.5 items-center justify-center overflow-hidden rounded-full bg-slate-150 dark:bg-gray-900"
      aria-label="Close Connection"
      role="button"
      @click="closeConnection"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <div class="absolute overflow-hidden">
        <PowerOffSVG v-if="hovered" class="pointer-events-none h-12 w-12" />
        <PowerOnSVG v-else class="pointer-events-none h-12 w-12" />
      </div>
    </div>
  </DefineTemplate>
  <CommonButton v-show="!isActualActive" :class="buttonClass" size="lg" @click="openWeb3Modal">
    Connect
  </CommonButton>
  <div v-show="isActualActive" class="flex items-center gap-[14px]">
    <button
      v-if="!hideGas"
      class="flex items-center justify-between gap-2 rounded-5 bg-slate-100 px-4 py-[9px] dark:bg-gray-900"
      @click="openTopUpGasModal()"
    >
      <GasSVG
        class="transition-colors"
        :class="
          toBN(pendingGasAmount.data.value).gt('0')
            ? 'text-orange-400'
            : 'text-gray-400'
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

      <span class="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-white">
        <PlusSVG />
      </span>
    </button>
    <template v-if="!hideEOA">
      <button class="relative flex items-center justify-between gap-x-2.5 rounded-7.5 bg-slate-100 px-4.5 py-2.5 leading-5 dark:bg-gray-900 sm:px-4 sm:py-3">
        <div class="flex items-center gap-[14px]">
          <Tippy
            arrow
            interactive
            class="wallet-provider"
          >
            <component :is="connectedProvider.logo" v-if="connectedProvider" class="h-7.5 w-7.5 sm:h-6 sm:w-6" />
            <template #content>
              <div class="flex w-full justify-between rounded-5 border p-5 dark:border-gray-800 dark:bg-gray-850">
                <div class="flex gap-4">
                  <div class="flex items-center gap-4">
                    <div v-if="connectedProvider">
                      <component :is="connectedProvider.logo" class="h-7.5 w-7.5 sm:h-9 sm:w-9" />
                    </div>
                    <div class="flex flex-col items-start gap-2">
                      <span class="text-xs font-medium leading-[10px] text-gray-500">Owner's Address</span>
                      <span class="inline-flex items-center gap-2 text-lg font-semibold leading-5">{{ addressLabel }}
                        <Copy :text="trackingAccount || account" :icon-only="true" />
                      </span>
                    </div>
                  </div>

                  <DisconnectButton />
                </div>
              </div>
            </template>
          </Tippy>
          <DisconnectButton />
        </div>
      </button>
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

<style>
.wallet-provider ~ [data-tippy-root] > .tippy-box {
  @apply !p-0 !bg-transparent !rounded-none;
}
</style>
