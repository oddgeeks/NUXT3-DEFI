<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'

const { safeBookmarks } = useBookmark()

function getIcon(session: SessionTypes.Struct) {
  const [icon] = session.peer.metadata.icons

  return icon
}
</script>

<template>
  <div class="relative">
    <div :class="safeBookmarks?.length > 3 ? 'px-10' : ''">
      <Splide :options="{ pagination: false, gap: '16px', autoWidth: true, arrows: safeBookmarks?.length > 3, arrowPath: 'M2 20.9997L40 20.9997M40 20.9997L21 2M40 20.9997L21 40' }">
        <SplideSlide v-for="bookmark in safeBookmarks" :key="bookmark.name">
          <li class="dark:bg-gray-850 flex items-center gap-[14px] rounded-10 bg-slate-50">
            <button
              class="flex items-center gap-2.5 text-xs font-medium pl-[14px] whitespace-nowrap py-2.5"
              @click="openWCTransactionModal({
                chainId: String(bookmark.chainId),
                payload: bookmark.payload,
                sessionV2: bookmark.session,
                metadata: '0x',
                bookmark,
              })"
            >
              <SafeTokenLogo network-logo-class="!w-5 !h-5" class="w-[28px] h-[28px]" :chain-id="bookmark.chainId" :url="getIcon(bookmark.session)" />
              <span class="text-sm overflow-hidden text-left whitespace-nowrap text-shadow sm:w-[148px] w-[200px]">
                {{ bookmark.name }}
              </span>
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
        </SplideSlide>
      </Splide>
    </div>
  </div>
</template>
