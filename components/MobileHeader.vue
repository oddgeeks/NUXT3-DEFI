<script lang="ts" setup>
import Avocado from '@/assets/images/icons/avocado.svg'
import Hamburger from '@/assets/images/icons/hamburger.svg'
import SVGX from '~/assets/images/icons/x.svg'
import PowerSVG from '~/assets/images/icons/power.svg'
import QrSVG from '~/assets/images/icons/qr.svg'
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg'
import InstadappSVG from '@/assets/images/logo/instadapp.svg'

const { active, deactivate, connector } = useWeb3()
const [opened, toggle] = useToggle(false)
const { setConnectorName } = useConnectors()

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
  <header
    class="flex flex-col transition-transform py-[60px] bg-gray-50 dark:bg-gray-850 z-40 w-full overflow-y-auto"
    :class="{ 'rounded-b-5': !opened, 'h-screen': opened }"
  >
    <div class="flex justify-between items-center px-5" :class="{ 'pb-5': !opened, 'pb-7.5': opened }">
      <NuxtLink to="/" class="flex items-center">
        <div class="bg-primary w-10 h-10 rounded-[14px]">
          <Avocado class="text-white" />
        </div>
        <span v-if="!active" class="ml-2">Avocado</span>
      </NuxtLink>

      <Web3Button v-if="active" :hide-e-o-a="true" />

      <button
        v-if="active"
        class="flex items-center justify-center dark:bg-slate-800 bg-slate-100 w-10 h-10 rounded-[14px] text-slate-500"
        @click="toggle(!opened)"
      >
        <SVGX v-if="opened" class="w-5 h-5" />
        <Hamburger v-else />
      </button>

      <div v-if="!active">
        <CommonButton size="md" @click="openWeb3Modal">
          Connect
        </CommonButton>
      </div>
    </div>
    <div v-if="opened" class="flex flex-col w-full">
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
            @click="openQrCode"
          >
            <QrSVG class="text-slate-400 w-4.5 h-4.5" />
          </button>

          <Web3Button :hide-gas="true" :hide-power="true" />

          <NuxtLink
            :href="`/w/${account}`"
            external
            target="_blank"
            class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
          >
            <ExternalLinkSVG class="text-slate-400 w-4.5 h-4.5" />
          </NuxtLink>
        </div>
        <div class="flex flex-col items-center gap-3">
          <SupportedChains :account="account" :max-count="6" class="!flex justify-between !gap-4" />
          <button class="text-primary text-xs" @click="openSupportedNetworks">
            View All Supported EVM Networks
          </button>
        </div>
      </div>
      <Navigation class="w-full" @navigate="toggle(false)" />
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
  </header>
</template>
