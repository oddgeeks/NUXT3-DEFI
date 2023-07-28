<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'
import { useKeenSlider } from 'keen-slider/vue.es'
import 'keen-slider/keen-slider.min.css'

const { safeBookmarks } = useBookmark()

const [containerRef, slider] = useKeenSlider({
  mode: 'snap',
  rtl: false,
  slides: { perView: 'auto' },
}, [
  // add plugins here
])

function getIcon(session: SessionTypes.Struct) {
  const [icon] = session.peer.metadata.icons

  return icon
}
</script>

<template>
  <div class="relative">
    <div
      class="navigation-pattern left pl-[15px] absolute left-10 z-10 h-full pointer-events-none"
    >
      <button class="arrow-btn">
        <SvgoArrowLeft />
      </button>
    </div>
    <div>
      <ul
        ref="containerRef"
        class="keen-slider"
      >
        <li v-for="bookmark in safeBookmarks" :key="bookmark.name" :style="{ minWidth: '200px', maxWidth: '400px' }" class="dark:bg-gray-850 keen-slider__slide flex items-center gap-[14px] rounded-10 bg-slate-50">
          <button
            class="flex items-center gap-2.5 text-xs font-medium pl-[14px] py-2.5"
            @click="openWCTransactionModal({
              chainId: String(bookmark.chainId),
              payload: bookmark.payload,
              sessionV2: bookmark.session,
              metadata: '0x',
              bookmark,
            })"
          >
            <SafeTokenLogo network-logo-class="!w-5 !h-5" class="w-[28px] h-[28px]" :chain-id="bookmark.chainId" :url="getIcon(bookmark.session)" />
            {{ bookmark.name }}
          </button>
          <button
            @click="openCreateBookmarkModal({
              ...bookmark,
              edit: true,
            })"
          >
            <SvgoPencil class="text-slate-400 shrink-0 mr-[14px]" />
          </button>
        </li>
      </ul>
    </div>
    <div
      class="navigation-pattern absolute right-0 pr-[15px] h-full pointer-events-none"
    >
      <button class="arrow-btn ml-auto">
        <SvgoArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
