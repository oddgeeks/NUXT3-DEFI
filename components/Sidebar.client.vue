<script setup lang="ts">
import QrSVG from '~/assets/images/icons/qr.svg'

const { collapsed, toggleCollapse, hideSidebar, actualWidth, isMobile, hidden } = useSidebar()
const { safeAddress } = useAvocadoSafe()
const { selectedSafe, isSelectedSafeLegacy } = storeToRefs(useSafe())
const { navigations } = useNavigation()
const route = useRoute()

const tippyOptions = {
  arrow: true,
  arrowType: 'round',
  animation: 'fade',
  placement: 'right',
}

const target = ref<HTMLElement | null>(null)

onClickOutside(target, () => {
  hideSidebar()
}, {
  ignore: ['.modal', 'wcm-modal'],
})

watch(() => route.fullPath, () => {
  hideSidebar()
})
</script>

<template>
  <Teleport to="body">
    <button
      v-if="actualWidth"
      :style="{ left: `${actualWidth - 14}px` }"
      class="fixed top-7.5 z-[40] hidden h-7 w-7 items-center justify-center rounded-full bg-gray-900 transition sm:flex"
      @click="toggleCollapse"
    >
      <SvgoArrowRight
        class="h-3.5 w-3.5 text-gray-400"
        :class="{ 'rotate-180': !collapsed }"
      />
    </button>
    <aside ref="target" :style="{ width: `${actualWidth}px` }" style="scrollbar-gutter:stable;overflow-y:overlay;" class="scroll-style fixed top-0 z-30 flex h-full shrink-0 overflow-y-auto bg-gray-850 transition-all sm:h-screen">
      <div v-if="collapsed && !isMobile" class="flex w-full flex-col items-center gap-6 p-7.5">
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
            class="flex w-full items-center justify-center rounded-5 bg-gray-900 py-4"
            @click="openQrCode"
          >
            <QrSVG class="h-4.5 w-4.5" />
          </button>

          <div
            class="flex w-full items-center justify-center rounded-5 bg-gray-900"
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
        <div :class="{ 'pointer-events-none blur': !safeAddress }" class="flex w-full flex-col items-center gap-2.5 rounded-5 bg-gray-900 py-2.5 text-gray-400">
          <NuxtLink
            v-if="isSelectedSafeLegacy"
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'Migration',
              placement: 'right',
            }"
            class="px-5 pb-1 pt-3"
            active-class="text-primary"
            to="/migration"
          >
            <SvgoArrowRight class="h-4 w-4" />
          </NuxtLink>

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

      <div v-else class="flex w-full flex-col">
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
    </aside>
    <div :class="hidden ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'" :style="{ width: 'calc(100% - 324px)' }" class="fixed right-0 top-0 z-40 block h-full bg-[#E2E8F033] backdrop-blur-[4px] transition-opacity sm:hidden" />
  </Teleport>
</template>
