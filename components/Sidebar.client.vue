<script setup lang="ts">
import HomeSVG from '~/assets/images/icons/home.svg'
import ContactSVG from '~/assets/images/icons/contact.svg'
import FireSVG from '~/assets/images/icons/fire.svg'
import CalendarSVG from '~/assets/images/icons/calendar.svg'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import Avocado from '@/assets/images/icons/avocado.svg'
import QrSVG from '~/assets/images/icons/qr.svg'

const { opened, toggleSidebar } = useSidebar()
const { safeAddress } = useAvocadoSafe()
const { account } = useWeb3()
</script>

<template>
  <aside style="scrollbar-gutter:stable;overflow-y:overlay;" class="hidden sticky top-0 h-screen sm:flex overflow-y-auto scroll-style dark:bg-gray-850 bg-slate-50 transition-[width]" :class="{ 'w-[340px]': opened, 'w-[120px]': !opened }">
    <div v-if="opened" class="flex flex-col w-full">
      <div class="flex flex-col gap-6 pt-7.5 pb-6 px-7.5">
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
        <div class="flex">
          <QrCode />
        </div>
        <div class="flex flex-col items-start gap-3">
          <SupportedChains :max-count="6" class="!flex justify-between !gap-3" />
        </div>
      </div>
      <Navigation />
    </div>
    <div v-else class="flex flex-col items-center w-full p-7.5 gap-6">
      <div class="flex flex-col items-center gap-5">
        <NuxtLink to="/">
          <Avocado class="text-primary" />
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
      <div class="flex flex-col w-full gap-4" :class="{ 'blur pointer-events-none': !safeAddress }">
        <button
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Show Avocado QR Code',
            placement: 'right',
          }"
          class="flex justify-center items-center dark:bg-slate-800 bg-slate-100 w-full rounded-5 py-4"
          @click="openQrCode"
        >
          <QrSVG class="w-4.5 h-4.5" />
        </button>

        <div
          class="flex justify-center items-center dark:bg-slate-800 bg-slate-100 w-full rounded-5"
        >
          <Copy
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'Copy Your Avocado Address',
              placement: 'right',
            }"
            :icon-only="true"
            class="text-xs p-4"
            :text="safeAddress"
          />
        </div>
      </div>
      <div :class="{ 'blur pointer-events-none': !safeAddress }" class="flex gap-2.5 py-2.5 flex-col items-center dark:bg-slate-800 bg-slate-100 text-slate-400 w-full rounded-5">
        <NuxtLink
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Home',
            placement: 'right',
          }"
          class="px-5 py-3"
          active-class="text-primary"
          to="/"
        >
          <HomeSVG class="w-4 h-4" />
        </NuxtLink>
        <NuxtLink
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'Contacts',
            placement: 'right',
          }"
          class="px-5 py-3"
          active-class="text-primary"
          to="/contacts"
        >
          <ContactSVG class="w-4 h-4" />
        </NuxtLink>
        <NuxtLink
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'View your NFTs',
            placement: 'right',
          }"
          class="px-5 py-3"
          active-class="text-primary"
          to="/nft"
        >
          <FireSVG class="w-4 h-4" />
        </NuxtLink>
        <NuxtLink
          v-tippy="{
            arrow: true,
            arrowType: 'round',
            animation: 'fade',
            content: 'History',
            placement: 'right',
          }"
          class="px-5 py-3"
          external
          target="_blank"
          :to="`${avoExplorerURL}/address/${account}`"
        >
          <CalendarSVG class="w-4 h-4" />
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>
