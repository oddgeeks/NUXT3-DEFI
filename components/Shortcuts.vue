<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'

const { safeBookmarks } = useBookmark()

function getIcon(session: SessionTypes.Struct) {
  const [icon] = session.peer.metadata.icons

  return icon
}
</script>

<template>
  <div>
    <ul class="flex gap-[15px] flex-wrap">
      <li v-for="bookmark in safeBookmarks" :key="bookmark.name" class="dark:bg-gray-850 flex items-center gap-[14px] rounded-10 bg-slate-50">
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
</template>
