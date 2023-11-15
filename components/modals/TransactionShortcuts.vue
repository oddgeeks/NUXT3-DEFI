<script setup lang="ts">
import Fuse from 'fuse.js'

const search = ref('')
const searcInputFocused = ref(false)

const { safeBookmarks, getBookmarkTypeLabel, initializeBookmark } = useBookmark()
const { getTokenByAddress } = useTokens()

const filteredShortcuts = computed(() => {
  if (!search.value)
    return safeBookmarks.value

  const fuse = new Fuse(safeBookmarks.value || [], {
    keys: ['name'],
    threshold: 0.5,
  })

  const result = fuse.search(search.value)

  return result.map(i => i.item)
})
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
</script>

<template>
  <div>
    <ModalTitle class="border-b border-gray-875 p-5 sm:p-7.5">
      <template #icon>
        <SvgoBookmark class="text-white" />
      </template>
      <template #title>
        Txn Shortcuts
      </template>
      <template #subtitle>
        Take your experience with Avocado to the next level using Txn shortcuts!
      </template>
    </ModalTitle>
    <div class="flex flex-col gap-2.5 p-5 sm:px-7.5 sm:pb-7.5 sm:pt-4">
      <div class="flex items-center justify-between">
        <span class="text-sm">
          All Shortcuts
        </span>
      </div>
      <CommonInput
        v-model="search" placeholder="Search name" container-classes="rounded-[40px] !px-4"
        input-classes="!py-2.5" type="search" @input-blur="searcInputFocused = false"
        @input-focus="searcInputFocused = true"
      >
        <template #prefix>
          <SvgoSearch class="mr-2" />
        </template>
      </CommonInput>
      <div class="grid min-h-[220px] grid-cols-2 items-baseline gap-4">
        <div v-for="shortcut in filteredShortcuts" :key="shortcut.name" class="flex items-start rounded-2xl border border-gray-800 bg-gray-850 px-4 py-[14px] hover:bg-gray-900">
          <button class="flex flex-1 gap-3" @click="initializeBookmark(shortcut)">
            <SafeTokenLogo network-logo-class="!w-5 !h-5" class="h-7.5 w-7.5" :chain-id="shortcut.chainId" :url="getIcon(shortcut)" />
            <div class="flex flex-col gap-1 text-left">
              <h2 class="text-sm font-bold leading-5">
                {{ shortcut.name }}
              </h2>
              <p class="text-xs text-gray-400">
                {{ getBookmarkTypeLabel(shortcut.type) }}
              </p>
            </div>
          </button>

          <button
            @click="openCreateBookmarkModal({
              ...shortcut,
              edit: true,
            })"
          >
            <SvgoPencil class="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
