<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Tippy } from 'vue-tippy'

defineProps({
  hideGas: Boolean,
  hideEOA: Boolean,
  hidePower: Boolean,
  buttonClass: String,
})

const { active, account } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { gasBalance, ensName } = storeToRefs(useSafe())
const { cachedProviderName, onDisconnect } = useConnectors()
const { providers } = useNetworks()

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
    open.value = false
    onDisconnect()
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
</script>

<template>
  <DefineTemplate>
    <button
      class="disconnect-btn relative flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gray-900 text-primary hover:text-red-alert"
      aria-label="Close Connection"
      role="button"
      @click="closeConnection"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <div class="disconnect-btn-svg-wrapper absolute left-1/2 top-1/2 flex h-full w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <SvgoPowerOn class="shrink-0 " />
      </div>
    </button>
  </DefineTemplate>
  <CommonButton v-if="!isActualActive" :class="buttonClass" size="lg" @click="openWeb3Modal">
    Connect
  </CommonButton>
  <div v-else class="flex items-center gap-4">
    <button
      v-if="!hideGas"
      class="flex items-center justify-between gap-2 rounded-5 bg-gray-900 px-4 py-2 text-sm sm:py-3"
      @click="openTopUpGasModal()"
    >
      <SvgoGas
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

      <span class="ml-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-white">
        <SvgoPlus />
      </span>
    </button>
    <template v-if="!hideEOA">
      <button class="relative flex items-center justify-between gap-x-2.5 rounded-7.5 bg-gray-900 px-4 py-2 leading-5 sm:px-4 sm:py-2.5">
        <Tippy
          arrow
          interactive
          class="wallet-provider"
        >
          <ProviderLogo v-if="connectedProvider" class="h-5 w-5 sm:h-6 sm:w-6" :provider-name="connectedProvider.name" />
          <template #content>
            <div class="flex w-full justify-between rounded-5 border border-gray-800 bg-gray-850 p-5">
              <div class="flex gap-4">
                <div class="flex items-center gap-4">
                  <ProviderLogo v-if="connectedProvider" class="h-7.5 w-7.5 sm:h-9 sm:w-9" :provider-name="connectedProvider.name" />
                  <div class="flex flex-col items-start gap-2">
                    <span class="text-xs font-medium leading-[10px] text-gray-500">Owner's Address</span>
                    <span class="inline-flex items-center gap-2 text-lg font-semibold leading-5 text-white">
                      {{ addressLabel }}
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

.disconnect-btn .disconnect-btn-svg-wrapper {
filter: drop-shadow(0px 0px 6px theme('colors.primary.DEFAULT'));
}

.disconnect-btn:hover .disconnect-btn-svg-wrapper {
filter: drop-shadow(0px 0px 6px theme('colors.red.alert'));
}
</style>
