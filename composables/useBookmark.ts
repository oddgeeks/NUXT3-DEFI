import { getAddress } from 'ethers/lib/utils'
import { storeToRefs } from 'pinia'

const bookmarks = useLocalStorage<IBookmark[]>('tx-bookmarks', [])

export function useBookmark() {
  const { safeAddress } = storeToRefs(useSafe())
  const addBookmark = (bookmark: IBookmark) => {
    // check if bookmark already exists
    const exists = bookmarks.value.find(b => b.name === bookmark.name)
    if (exists)
      throw new Error('Bookmark already exists')

    bookmarks.value.push(bookmark)
  }

  const updateBookmark = (bkmrk: IBookmark, newBookmark: IBookmark) => {
    const bookmark = bookmarks.value.find(b => b.name === bkmrk.name && getAddress(b.safeAddress) === getAddress(safeAddress.value))

    if (!bookmark)
      throw new Error('Bookmark not found')

    Object.assign(bookmark, newBookmark)
  }

  const deleteBookmark = (name?: string) => {
    if (!name)
      return

    const index = bookmarks.value.findIndex(b => b.name === name && getAddress(b.safeAddress) === getAddress(safeAddress.value))

    if (index === -1)
      throw new Error('Bookmark not found')

    bookmarks.value.splice(index, 1)
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
    deleteBookmark,
  }
}
