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
          <li class="flex items-center gap-[14px] rounded-10 bg-gray-850">
            <button
              class="flex items-center gap-2.5 whitespace-nowrap py-2.5 pl-[14px] text-xs font-medium"
              @click="handleOpenBookmark(bookmark)"
            >
              <SafeTokenLogo network-logo-class="!w-5 !h-5" class="h-[28px] w-[28px]" :chain-id="bookmark.chainId" :url="getIcon(bookmark)" />
              <span class="max-w-[200px] overflow-hidden truncate whitespace-nowrap text-left text-sm sm:max-w-[500px]">
                {{ bookmark.name }}
              </span>
            </button>
            <button
              @click="openCreateBookmarkModal({
                ...bookmark,
                edit: true,
              })"
            >
              <SvgoPencil class="mr-[14px] shrink-0 text-gray-400" />
            </button>
          </li>
        </SplideSlide>
      </Splide>
      <p v-else class="text-sm font-medium leading-[22px] text-gray-400">
        Bookmark your most used transactions with Transaction Shortcuts to quickly execute common actions. Find the bookmark on the transaction confirmation panel.
      </p>
    </div>
  </div>
</template>
