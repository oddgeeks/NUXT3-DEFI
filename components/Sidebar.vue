<script setup lang="ts">
import HomeSVG from '~/assets/images/icons/home.svg'
import ContactSVG from '~/assets/images/icons/contact.svg'
import FireSVG from '~/assets/images/icons/fire.svg'
import CalendarSVG from '~/assets/images/icons/calendar.svg'
import SwapSVG from '~/assets/images/icons/refresh.svg'
import BridgeSVG from '~/assets/images/icons/bridge.svg'
import PlusCircleSVG from '~/assets/images/icons/plus-circle.svg'
import RefreshSVG from '~/assets/images/icons/refresh-2.svg'
import QuestionSVG from '~/assets/images/icons/question-circle-2.svg'
import MoreOptionsSVG from '~/assets/images/icons/more-options.svg'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'

const { opened, toggleSidebar } = useSidebar()

const { account } = useWeb3()
const [moreOptions, toggleOptions] = useToggle(false)
</script>

<template>
  <div class="flex h-full dark:bg-gray-850 bg-slate-50 w-[340px] flex flex-col">
    <div class="flex flex-col border-b-1 dark:border-slate-750 border-slate-150 gap-6 pt-7.5 pb-6 px-7.5">
      <div class="flex items-center justify-between">
        <NuxtLink to="/">
          <Logo />
        </NuxtLink>
        <button
          class="w-7 h-7 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
          @click="toggleSidebar"
        >
          <ArrowRight
            class="w-3.5 h-3.5 text-slate-400"
            :class="{ 'rotate-180': opened }"
          />
        </button>
      </div>
      <QrCode />
      <div class="gap-3">
        <SupportedChains :account="account" class="!flex justify-between !gap-0" />
        <span class="text-primary text-xs">View All Supported EVM Networks</span>
      </div>
    </div>
    <div class="flex flex-col gap-2 border-b-1 dark:border-slate-750 border-slate-150 px-7.5 py-4 text-slate-400 font-base">
      <NuxtLink
        active-class="text-primary"
        class="flex h-11 items-center gap-2.5"
        to="/"
      >
        <HomeSVG class="w-4 h-4" />
        Home
      </NuxtLink>
      <NuxtLink
        active-class="text-primary"
        class="flex h-11 items-center gap-2.5"
        to="/contacts"
      >
        <ContactSVG class="w-4 h-4" />
        Contacts
      </NuxtLink>
      <NuxtLink
        active-class="text-primary"
        class="flex h-11 items-center gap-2.5"
        to="/nft"
      >
        <FireSVG class="w-4 h-4" />
        View your NFTs
      </NuxtLink>
      <NuxtLink
        class="flex h-11 items-center gap-2.5"
        external
        target="_blank"
        :to="`${avoExplorerURL}/address/${account}`"
      >
        <CalendarSVG class="w-4 h-4" />
        History
      </NuxtLink>
    </div>
    <div class="flex flex-col gap-2 border-b-1 dark:border-slate-750 border-slate-150 px-7.5 py-4 text-slate-400">
      <button
        class="flex h-11 items-center justify-between"
        :class="{
          'text-white': moreOptions,
        }"
        @click="toggleOptions(!moreOptions)"
      >
        <div class="flex items-center gap-2.5">
          <MoreOptionsSVG class="w-4 h-4" />
          More options
        </div>
        <ChevronDownSVG
          class="w-4 h-4"
          :class="{
            'rotate-180': moreOptions,
          }"
        />
      </button>
      <div v-if="moreOptions" class="flex flex-col gap-2">
        <button
          class="flex h-11 items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openSwap"
        >
          <SwapSVG class="w-4 h-4" />
          Swap
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openBridge"
        >
          <BridgeSVG class="w-4 h-4" />
          Bridge
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          @click="addCustomToken"
        >
          <PlusCircleSVG class="w-4 h-4" />
          Add custom Tokens
        </button>
        <NuxtLink
          active-class="text-primary"
          class="flex h-11 items-center gap-2.5"
          to="/upgrade"
        >
          <RefreshSVG class="w-4 h-4" />
          Deploy/Upgrade
        </NuxtLink>
        <NuxtLink
          class="flex h-11 items-center gap-2.5"
          external
          target="_blank"
          to="https://help.avocado.instadapp.io"
        >
          <QuestionSVG class="w-4 h-4" />
          Help
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
