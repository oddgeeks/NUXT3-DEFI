<script setup lang="ts">
import InstadappSVG from '@/assets/images/logo/instadapp.svg'
import PowerSVG from '~/assets/images/icons/power.svg'
import Avocado from '@/assets/images/icons/avocado.svg'
import SVGX from '~/assets/images/icons/x.svg'

defineEmits(['destroy'])

const { active, deactivate, connector } = useWeb3()
const { setConnectorName } = useConnectors()

async function closeConnection() {
  const { success } = await openDisconnectWalletModal()

  if (success) {
    setConnectorName(null)
    if (connector.value)
      deactivate()
  }
}
</script>

<template>
  <div class="flex flex-col items-center dark:bg-gray-850 bg-slate-50 -mx-5 -my-5 px-5 pt-[60px] gap-6 h-screen">
    <div class="flex justify-between items-center w-full">
      <NuxtLink to="/" class="flex rounded-[14px] bg-primary items-center" @click="$emit('destroy')">
        <Avocado class="text-white" />
      </NuxtLink>

      <Web3Button v-if="active" :hide-e-o-a="true" />

      <button class="flex items-center justify-center w-10 h-10 rounded-[14px] dark:bg-slate-800 bg-slate-150" @click="$emit('destroy')">
        <SVGX class="w-4.5 h-4.5 dark:text-slate-500 text-slate-400" />
      </button>
    </div>

    <div
      v-show="active"
      class="flex w-full justify-between items-center mt-1.5"
    >
      <div
        role="button"
        tabindex="0"
        class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
      >
        <ColorModeSwitcher />
      </div>

      <Web3Button :hide-gas="true" />

      <button
        class="bg-slate-100 dark:bg-slate-800 w-10 h-10 flex justify-center items-center rounded-full"
        @click="closeConnection"
      >
        <PowerSVG class="w-[22px] h-[22px] text-slate-400" />
      </button>
    </div>
    <OptionsAndAuthority class="w-full" @item-clicked="$emit('destroy')" />

    <nav class="flex gap-5 flex-col text-xs text-slate-400 mt-1.5 w-full">
      <div class="flex w-full justify-around">
        <a target="_blank" href="https://help.avocado.instadapp.io">Help</a>
        <a href="mailto:info@instadapp.io">Email</a>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://twitter.com/instadapp"
        >Twitter</a>
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://discord.com/invite/C76CeZc"
        >Discord</a>
      </div>
    </nav>

    <figure
      class="flex gap-3 items-center border-2 border-slate-100 dark:border-slate-800 rounded-full py-2 px-4 mt-2"
    >
      <figcaption class="text-xs text-slate-400">
        Built by
      </figcaption>
      <a target="_blank" href="https://instadapp.io/">
        <InstadappSVG />
      </a>
    </figure>
  </div>
</template>
