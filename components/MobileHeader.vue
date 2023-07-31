<script lang="ts" setup>
import Avocado from '@/assets/images/icons/avocado.svg?component'
import Hamburger from '@/assets/images/icons/hamburger.svg?component'
import SVGX from '~/assets/images/icons/x.svg?component'
import PowerSVG from '~/assets/images/icons/power.svg?component'
import QrSVG from '~/assets/images/icons/qr.svg?component'
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'
import InstadappSVG from '@/assets/images/logo/instadapp.svg?component'

const { active, deactivate, connector, account } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { safeAddress } = useAvocadoSafe()
const ensName = ref()
const { resetAccounts } = useSafe()
const [opened, toggle] = useToggle(false)
const [walletListOpened, toggleWalletList] = useToggle(false)
const { setConnectorName, cachedProviderName } = useConnectors()
const { providers } = useNetworks()
const {
  showTrackingBanner,
} = useBanner()
const router = useRouter()

const addressLabel = computed(() =>
  trackingAccount.value
    ? `Tracking: ${shortenHash(trackingAccount.value, 4)}`
    : ensName.value || shortenHash(account.value, 4),
)

const isActualActive = computed(() => {
  if (trackingAccount.value)
    return true
  return active.value
})

const connectedProvider = computed(() => {
  return providers.find(item => item.id === cachedProviderName.value)
})

async function closeConnection() {
  const { success } = await openDisconnectWalletModal()

  if (success) {
    resetAccounts()
    setConnectorName(null)
    router.push('/login')
    if (connector.value)
      deactivate()
  }
}

watch(() => active.value, () => {
  if (!active.value)
    toggle(false)
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
  <div
    class="flex flex-col transition-transform bg-gray-50 dark:bg-gray-850 left-0 z-40 w-full fixed sm:hidden"
    :class="
      [{ 'rounded-b-5': !opened, '': opened },
       showTrackingBanner ? 'top-9' : 'top-0',
      ]"
  >
    <div class="flex justify-between items-center p-5">
      <NuxtLink to="/" class="flex items-center">
        <div class="flex items-center justify-center w-10 h-10 rounded-[14px]">
          <SvgoAvocado2 class="text-white w-6 h-6" />
        </div>
        <span v-if="!isActualActive" class="ml-2">Avocado</span>
      </NuxtLink>

      <Web3Button v-if="isActualActive" :hide-e-o-a="true" />

      <button
        v-if="isActualActive"
        class="flex items-center justify-center dark:bg-slate-800 bg-slate-100 w-10 h-10 rounded-[14px] text-slate-500"
        @click="toggle(!opened)"
      >
        <SVGX v-if="opened" class="w-5 h-5" />
        <Hamburger v-else />
      </button>

      <div v-if="!isActualActive">
        <CommonButton size="md" @click="openWeb3Modal">
          Connect
        </CommonButton>
      </div>
    </div>
    <div v-if="opened" class="flex flex-col w-full mt-2.5 pb-[160px] h-screen overflow-auto">
      <div class="flex w-full justify-between items-center px-5 py-6 border-y-1 dark:border-slate-750 border-slate-150">
        <div
          role="button"
          tabindex="0"
          class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
        >
          <ColorModeSwitcher />
        </div>

        <button class="bg-slate-100 relative rounded-7.5 dark:bg-slate-800 py-2.5 sm:py-3 px-4.5 sm:px-4 leading-5 justify-between flex items-center gap-x-2.5" @click="toggleWalletList(!walletListOpened)">
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

          <SvgoChevronDown :class="`shrink-0${walletListOpened ? ' -rotate-180' : ''}`" />
        </button>

        <button
          class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
          @click="closeConnection"
        >
          <PowerSVG class="text-slate-400" />
        </button>
      </div>
      <div v-if="walletListOpened" class="px-[20px] py-[24px]">
        <WalletItemList />
      </div>
      <div class="flex flex-col items-center w-full px-5 py-6 gap-6">
        <div class="flex justify-between items-center w-full">
          <button
            class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
            @click="openYourWalletModal(safeAddress)"
          >
            <QrSVG class="text-slate-400 w-4.5 h-4.5" />
          </button>

          <div class="px-4 dark:bg-slate-800 bg-slate-150 rounded-full h-[54px] flex items-center">
            <Copy :text="safeAddress">
              <template #content>
                <div class="flex items-center gap-3">
                  <Avocado class="text-primary" />
                  <div class="flex flex-col">
                    <span class="text-left text-xs text-slate-500">Avo Address</span>
                    <span class="dark:text-white text-slate-900">{{ shortenHash(safeAddress) }}</span>
                  </div>
                </div>
              </template>
            </Copy>
          </div>

          <NuxtLink
            :href="`/w/${safeAddress}`"
            external
            target="_blank"
            class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
          >
            <ExternalLinkSVG class="text-slate-400 w-4.5 h-4.5" />
          </NuxtLink>
        </div>
        <div class="flex flex-col items-center gap-3">
          <SupportedChains :max-count="6" class="!flex justify-between !gap-4" />
        </div>
      </div>
      <Navigation @navigate="toggle(false)" />
      <div class="flex flex-col gap-7.5 px-[44px]">
        <nav class="flex gap-5 flex-col text-xs text-slate-400 mt-1.5 w-full">
          <div class="flex w-full justify-around">
            <a target="_blank" href="https://help.avocado.instadapp.io">Help</a>
            <a href="mailto:info@instadapp.io">Email</a>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://twitter.com/instadapp"
            >
              Twitter
            </a>
            <a
              rel="noopener noreferrer"
              target="_blank"
              href="https://discord.com/invite/C76CeZc"
            >
              Discord
            </a>
          </div>
        </nav>
        <div class="flex justify-center">
          <figure
            class="flex gap-3 items-center border-2 border-slate-100 dark:border-slate-800 rounded-full py-2 px-4"
          >
            <figcaption class="text-xs text-slate-400">
              Built by
            </figcaption>
            <a target="_blank" href="https://instadapp.io/">
              <InstadappSVG />
            </a>
          </figure>
        </div>
      </div>
    </div>
  </div>
</template>
