<script setup lang="ts">
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'

const { safeBookmarks } = useBookmark()
const { getTokenByAddress } = useTokens()

function getIcon(bookmark: IBookmark) {
  if (bookmark.type === 'wc' && bookmark.session) {
    const [icon] = bookmark.session.peer.metadata.icons

    return icon
  }

  if (bookmark.type === 'transfer' && bookmark.sendData) {
    const token = getTokenByAddress(bookmark.sendData?.tokenAddress, bookmark.chainId)
    return token?.logoURI
  }
}

function handleOpenBookmark(bookmark: IBookmark) {
  if (bookmark.type === 'wc') {
    openWCTransactionModal({
      chainId: String(bookmark.chainId),
      payload: bookmark.payload,
      sessionV2: bookmark.session,
      metadata: bookmark.metadata || '0x',
      bookmark,
    })
  }

  if (bookmark.type === 'transfer')
    openSendModal(bookmark.chainId, undefined, undefined, bookmark)
}
</script>

<template>
  <div class="relative">
    <div :class="safeBookmarks?.length > 3 ? 'px-10' : ''">
      <Splide v-if="safeBookmarks?.length" :options="{ pagination: false, gap: '16px', autoWidth: true, arrows: safeBookmarks?.length > 3, arrowPath: 'M2 20.9997L40 20.9997M40 20.9997L21 2M40 20.9997L21 40' }">
        <SplideSlide v-for="bookmark in safeBookmarks" :key="bookmark.name">
          <li class="dark:bg-gray-850 flex items-center gap-[14px] rounded-10 bg-slate-50">
            <button
              class="flex items-center gap-2.5 text-xs font-medium pl-[14px] whitespace-nowrap py-2.5"
              @click="handleOpenBookmark(bookmark)"
            >
              <SafeTokenLogo network-logo-class="!w-5 !h-5" class="w-[28px] h-[28px]" :chain-id="bookmark.chainId" :url="getIcon(bookmark)" />
              <span class="text-sm overflow-hidden text-left whitespace-nowrap truncate sm:max-w-[500px] max-w-[200px]">
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
      <p v-else class="font-medium text-sm text-slate-400 leading-[22px]">
        Bookmark your most used transactions with Transaction Shortcuts to quickly execute common actions. Find the bookmark on the transaction confirmation panel.
      </p>
    </div>
  </div>
</template>
