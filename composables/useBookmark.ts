import { getAddress } from 'ethers/lib/utils'
import { storeToRefs } from 'pinia'

const bookmarks = useLocalStorage<IWcBookmark[]>('tx-bookmarks', [])

export function useBookmark() {
  const { safeAddress } = storeToRefs(useSafe())
  const addBookmark = (bookmark: IWcBookmark) => {
    // check if bookmark already exists
    const exists = bookmarks.value.find(b => b.name === bookmark.name)
    if (exists)
      throw new Error('Bookmark already exists')

    bookmarks.value.push(bookmark)
  }

  const updateBookmark = (oldName: string, name: string) => {
    const bookmark = bookmarks.value.find(b => b.name === oldName && getAddress(b.safeAddress) === getAddress(safeAddress.value))

    if (!bookmark)
      throw new Error('Bookmark not found')

    bookmark.name = name
  }

  const safeBookmarks = computed(() => {
    if (!safeAddress.value)
      return []

    return bookmarks.value.filter(b => getAddress(b.safeAddress) === getAddress(safeAddress.value))
  })

  return {
    bookmarks,
    addBookmark,
    updateBookmark,
    safeBookmarks,
  }
}
