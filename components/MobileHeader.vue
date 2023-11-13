<script lang="ts" setup>
import Hamburger from '@/assets/images/icons/hamburger.svg?component'
import SVGX from '~/assets/images/icons/x.svg?component'
import PowerSVG from '~/assets/images/icons/power.svg?component'
import QrSVG from '~/assets/images/icons/qr.svg?component'
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'
import InstadappSVG from '@/assets/images/logo/instadapp.svg?component'

const { active, account } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { safeAddress } = useAvocadoSafe()
const { ensName } = storeToRefs(useSafe())
const [opened, toggle] = useToggle(false)
const [walletListOpened, toggleWalletList] = useToggle(false)
const { cachedProviderName, onDisconnect } = useConnectors()
const { providers } = useNetworks()
const {
  showTrackingBanner,
} = useBanner()

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

  if (success)
    onDisconnect()
}

watch(() => active.value, () => {
  if (!active.value)
    toggle(false)
})
</script>

<template>
  <div
    class="fixed left-0 z-40 flex w-full flex-col bg-gray-50 transition-transform dark:bg-gray-850 sm:hidden"
    :class="
      [{ 'rounded-b-5': !opened, '': opened },
       showTrackingBanner ? 'top-9' : 'top-0',
      ]"
  >
    <div class="flex items-center justify-between p-5">
      <NuxtLink to="/" class="flex items-center">
        <div class="flex h-10 w-10 items-center justify-center">
          <SvgoAvocadoLogoMini class="h-full w-full" />
        </div>
        <span v-if="!isActualActive" class="ml-2">Avocado</span>
      </NuxtLink>

      <Web3Button v-if="isActualActive" :hide-e-o-a="true" />

      <button
        v-if="isActualActive"
        class="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-100 text-gray-500 dark:bg-gray-900"
        @click="toggle(!opened)"
      >
        <SVGX v-if="opened" class="h-5 w-5" />
        <Hamburger v-else />
      </button>

      <div v-if="!isActualActive">
        <CommonButton size="md" @click="openWeb3Modal">
          Connect
        </CommonButton>
      </div>
    </div>
    <div v-if="opened" class="mt-2.5 flex h-screen w-full flex-col overflow-auto pb-[160px]">
      <div class="flex w-full items-center justify-between border-y-1 border-slate-150 px-5 py-6 dark:border-slate-750">
        <div
          role="button"
          tabindex="0"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-900"
        >
          <ColorModeSwitcher />
        </div>

        <button class="relative flex items-center justify-between gap-x-2.5 rounded-7.5 bg-slate-100 px-4.5 py-2.5 leading-5 dark:bg-gray-900 sm:px-4 sm:py-3" @click="toggleWalletList(!walletListOpened)">
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

          <SvgoChevronDown :class="`shrink-0${walletListOpened ? ' -rotate-180' : ''}`" />
        </button>

        <button
          class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-900"
          @click="closeConnection"
        >
          <PowerSVG class="text-gray-400" />
        </button>
      </div>
      <div v-if="walletListOpened" class="px-[20px] py-[24px]">
        <WalletItemList />
      </div>
      <div class="flex w-full flex-col items-center gap-6 px-5 py-6">
        <div class="flex w-full items-center justify-between">
          <button
            class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-900"
            @click="openYourWalletModal(safeAddress)"
          >
            <QrSVG class="h-4.5 w-4.5 text-gray-400" />
          </button>

          <div class="flex h-[54px] items-center rounded-full bg-slate-150 px-4 dark:bg-gray-900">
            <Copy :text="safeAddress">
              <template #content>
                <div class="flex items-center gap-3">
                  <SvgoAvocadoLogoMini class="text-primary" />
                  <div class="flex flex-col">
                    <span class="text-left text-xs text-gray-500">Avo Address</span>
                    <span class="text-slate-900 dark:text-white">{{ shortenHash(safeAddress) }}</span>
                  </div>
                </div>
              </template>
            </Copy>
          </div>

          <NuxtLink
            :href="`/w/${safeAddress}`"
            external
            target="_blank"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-gray-900"
          >
            <ExternalLinkSVG class="h-4.5 w-4.5 text-gray-400" />
          </NuxtLink>
        </div>
        <div class="flex flex-col items-center gap-3">
          <SupportedChains :max-count="6" class="!flex justify-between !gap-4" />
        </div>
      </div>
      <Navigation @navigate="toggle(false)" />
      <div class="flex flex-col gap-7.5 px-[44px]">
        <nav class="mt-1.5 flex w-full flex-col gap-5 text-xs text-gray-400">
          <div class="flex w-full justify-around">
            <a target="_blank" href="https://guides.avocado.instadapp.io">Help</a>
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
            class="flex items-center gap-3 rounded-full border-2 border-slate-100 px-4 py-2 dark:border-gray-800"
          >
            <figcaption class="text-xs text-gray-400">
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
