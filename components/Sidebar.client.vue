<script setup lang="ts">
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import Avocado from '@/assets/images/icons/avocado.svg?component'
import QrSVG from '~/assets/images/icons/qr.svg?component'

const { opened, toggleSidebar } = useSidebar()
const { safeAddress } = useAvocadoSafe()
const { isSafeMultisig } = storeToRefs(useMultisig())
const { navigations } = useNavigation()

const width = 340
const collapsedWidth = 120

const actualWidth = computed(() => opened.value ? width : collapsedWidth)

const tippyOptions = {
  arrow: true,
  arrowType: 'round',
  animation: 'fade',
  placement: 'right',
}
</script>

<template>
  <div class="relative">
    <button
      :style="{ left: `${actualWidth - 14}px` }"
      class="w-7 h-7 fixed top-7.5  z-10 rounded-full items-center transition-[width] justify-center flex dark:bg-slate-800 bg-slate-100"
      @click="toggleSidebar"
    >
      <ArrowRight
        class="w-3.5 h-3.5 text-slate-400"
        :class="{ 'rotate-180': opened }"
      />
    </button>
    <aside :style="{ width: `${actualWidth}px` }" style="scrollbar-gutter:stable;overflow-y:overlay;" class="hidden shrink-0 sticky top-0 h-screen sm:flex overflow-y-auto scroll-style dark:bg-gray-850 bg-slate-50 transition-[width]">
      <div v-if="opened" class="flex flex-col w-full">
        <div class="flex flex-col gap-6 pt-7.5 pb-6 px-7.5">
          <div class="flex items-center justify-between gap-2.5">
            <NuxtLink class="flex items-center gap-2.5" to="/">
              <Logo />
              <MultisigBadge v-if="isSafeMultisig" />
            </NuxtLink>
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
          <NuxtLink class="flex flex-col items-center gap-2.5" to="/">
            <Avocado class="text-primary" />
            <MultisigBadge v-if="isSafeMultisig" />
          </NuxtLink>
        </div>
        <div class="flex flex-col w-full gap-4" :class="{ 'blur pointer-events-none': !safeAddress }">
          <button
            v-tippy="{
              ...tippyOptions,
              content: 'Show Avocado QR Code',
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
                ...tippyOptions,
                content: 'Copy Your Avocado Address',

              }"
              :icon-only="true"
              class="text-xs p-4"
              :text="safeAddress"
            />
          </div>
        </div>
        <div :class="{ 'blur pointer-events-none': !safeAddress }" class="flex gap-2.5 py-2.5 flex-col items-center dark:bg-slate-800 bg-slate-100 text-slate-400 w-full rounded-5">
          <template
            v-for="nav in navigations"
            :key="nav.to"
          >
            <NuxtLink
              v-if="!nav.hidden"
              v-tippy="{
                arrow: true,
                arrowType: 'round',
                animation: 'fade',
                content: nav.tooltip,
                placement: 'right',
              }"
              :target="nav.target"
              class="px-5 py-3"
              active-class="text-primary"
              :to="nav.to"
            >
              <component :is="nav.icon" class="w-4 h-4" />
            </NuxtLink>
          </template>
        </div>
      </div>
    </aside>
  </div>
</template>
