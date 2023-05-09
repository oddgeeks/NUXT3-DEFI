<script lang="ts" setup>
import Avocado from '@/assets/images/icons/avocado.svg'
import Hamburger from '@/assets/images/icons/hamburger.svg'
import SVGX from '~/assets/images/icons/x.svg'
import PowerSVG from '~/assets/images/icons/power.svg'
import QrSVG from '~/assets/images/icons/qr.svg'
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg'
import InstadappSVG from '@/assets/images/logo/instadapp.svg'

const { active, deactivate, connector, account } = useWeb3()
const { trackingAccount } = useAccountTrack()
const { safeAddress } = useAvocadoSafe()
const [opened, toggle] = useToggle(false)
const { setConnectorName } = useConnectors()
const {
  showTrackingBanner,
} = useBanner()

const isActualActive = computed(() => {
  if (trackingAccount.value)
    return true
  return active.value
})

async function closeConnection() {
  const { success } = await openDisconnectWalletModal()

  if (success) {
    setConnectorName(null)
    if (connector.value)
      deactivate()
  }
}

watch(() => active.value, () => {
  if (!active.value)
    toggle(false)
})
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
        <div class="flex items-center justify-center bg-primary w-10 h-10 rounded-[14px]">
          <Avocado class="text-white w-6 h-6" />
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

        <Web3Button :hide-gas="true" :hide-power="true" />

        <button
          class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
          @click="closeConnection"
        >
          <PowerSVG class="text-slate-400" />
        </button>
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
          <SupportedChains :account="account" :max-count="6" class="!flex justify-between !gap-4" />
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
