<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'
import PowerSVG from '~/assets/images/icons/power.svg?component'

const emit = defineEmits(['destroy'])

const { active, account, deactivate, connector } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { setConnectorName } = useConnectors()

const ensName = ref()
const isActualActive = computed(() => {
  if (trackingAccount.value)
    return true
  return active.value
})

const addressLabel = computed(() =>
  trackingAccount.value
    ? `Tracking: ${shortenHash(account.value, 4)}`
    : ensName.value || shortenHash(account.value, 4),
)

async function closeConnection() {
  const { success } = await openDisconnectWalletModal()

  if (success) {
    emit('destroy')
    trackingAccount.value = ''
    setConnectorName(null)
    if (connector.value)
      deactivate()
  }
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
  <div v-if="isActualActive" class="flex h-full border-1 dark:border-slate-750 border-slate-150 dark:bg-gray-850 bg-slate-50 rounded-5.5 w-[340px] flex flex-col -mx-[50px] -my-10">
    <div class="flex items-center justify-between border-b-1 dark:border-slate-750 border-slate-150 p-5">
      <button
        class="w-[34px] h-[34px] rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
        @click="$emit('destroy')"
      >
        <SVGX />
      </button>

      <div class="flex flex-col items-center">
        <span class="text-slate-500 text-xs">Owner's Address</span>
        <span class="text-lg">{{ addressLabel }}</span>
      </div>

      <button
        class="w-[34px] h-[34px] rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
        @click="closeConnection"
      >
        <PowerSVG class="w-5 h-5 text-slate-400" />
      </button>
    </div>
    <div class="flex flex-1 flex-col px-2.5 pb-2.5 overflow-y-hidden">
      <QrCode />
      <SupportedChains :account="account" class="!flex justify-between !gap-0 mx-2.5 mb-[28px]" />
      <OptionsAndAuthority class="flex-1 overflow-y-auto" @item-clicked="$emit('destroy')" />
    </div>
  </div>
</template>
