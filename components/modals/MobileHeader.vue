<script setup lang="ts">
import InstadappSVG from '@/assets/images/logo/instadapp.svg?component'
import Calendar from '@/assets/images/icons/calendar.svg?component'
import Hamburger from '@/assets/images/icons/hamburger.svg?component'
import Avocado from '@/assets/images/icons/avocado.svg?component'

defineEmits(['destroy'])

const { active, account } = useWeb3()
</script>

<template>
  <div class="flex flex-col items-center mb-7.5">
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

    <nav class="flex gap-5 flex-col text-xs text-slate-400 mt-5 w-full">
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

      <div v-if="account" class="flex justify-center gap-10">
        <NuxtLink
          active-class="dark:text-white text-slate-900"
          to="/contacts"
          @click="$emit('destroy')"
        >
          Contacts
        </NuxtLink>
        <NuxtLink
          active-class="dark:text-white text-slate-900"
          to="/nft"
          @click="$emit('destroy')"
        >
          NFT
        </NuxtLink>
      </div>
    </nav>

    <div
      v-show="active"
      class="flex w-full justify-between items-center mt-7.5"
    >
      <div
        role="button"
        tabindex="0"
        class="bg-slate-100 dark:bg-slate-800 w-[50px] h-[50px] flex justify-center items-center rounded-full"
      >
        <ColorModeSwitcher />
      </div>

      <Web3Button :hide-gas="true" />

      <NuxtLink
        class="bg-slate-100 dark:bg-slate-800 w-[50px] h-[50px] flex justify-center items-center rounded-full"
        external
        :to="`${avoExplorerURL}/address/${account}`"
      >
        <Calendar color="blue" />
      </NuxtLink>
    </div>
  </div>
  <div class="flex justify-between items-center">
    <NuxtLink to="/" class="flex items-center" @click="$emit('destroy')">
      <Avocado />
      <span v-if="!active" class="ml-2">Avocado</span>
    </NuxtLink>

    <Web3Button v-if="active" :hide-e-o-a="true" />

    <button v-if="active" @click="$emit('destroy')">
      <Hamburger />
    </button>
  </div>
</template>
