<script setup lang="ts">
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import QrSVG from '~/assets/images/icons/qr.svg?component'

const { opened, toggleSidebar } = useSidebar()
const { safeAddress } = useAvocadoSafe()
const { isSafeMultisig } = storeToRefs(useMultisig())
const { selectedSafe } = storeToRefs(useSafe())
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
      class="fixed top-7.5 z-10 flex  h-7 w-7 items-center justify-center rounded-full bg-slate-100 transition-[width] dark:bg-slate-800"
      @click="toggleSidebar"
    >
      <ArrowRight
        class="h-3.5 w-3.5 text-slate-400"
        :class="{ 'rotate-180': opened }"
      />
    </button>
    <aside :style="{ width: `${actualWidth}px` }" style="scrollbar-gutter:stable;overflow-y:overlay;" class="scroll-style sticky top-0 hidden h-screen shrink-0 overflow-y-auto bg-slate-50 transition-[width] dark:bg-gray-850 sm:flex">
      <div v-if="opened" class="flex w-full flex-col">
        <div class="flex flex-col gap-6 px-7.5 pb-6 pt-7.5">
          <div class="flex items-center justify-between gap-2.5">
            <NuxtLink class="flex items-center gap-2.5" to="/">
              <SvgoAvocadoLogo class="h-full w-full" />
              <SafeBadge v-if="selectedSafe" :safe="selectedSafe" />
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
      <div v-else class="flex w-full flex-col items-center gap-6 p-7.5">
        <div class="flex flex-col items-center gap-5">
          <NuxtLink class="flex flex-col items-center gap-2.5" to="/">
            <SvgoAvocadoLogoMini />
            <SafeBadge v-if="selectedSafe" :safe="selectedSafe" />
          </NuxtLink>
        </div>
        <div class="flex w-full flex-col gap-4" :class="{ 'pointer-events-none blur': !safeAddress }">
          <button
            v-tippy="{
              ...tippyOptions,
              content: 'Show Avocado QR Code',
            }"
            class="flex w-full items-center justify-center rounded-5 bg-slate-100 py-4 dark:bg-slate-800"
            @click="openQrCode"
          >
            <QrSVG class="h-4.5 w-4.5" />
          </button>

          <div
            class="flex w-full items-center justify-center rounded-5 bg-slate-100 dark:bg-slate-800"
          >
            <Copy
              v-tippy="{
                ...tippyOptions,
                content: 'Copy Your Avocado Address',

              }"
              :icon-only="true"
              class="p-4 text-xs"
              :text="safeAddress"
            />
          </div>
        </div>
        <div :class="{ 'pointer-events-none blur': !safeAddress }" class="flex w-full flex-col items-center gap-2.5 rounded-5 bg-slate-100 py-2.5 text-slate-400 dark:bg-slate-800">
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
              <component :is="nav.icon" class="h-4 w-4" />
            </NuxtLink>
          </template>
        </div>
      </div>
    </aside>
  </div>
</template>
