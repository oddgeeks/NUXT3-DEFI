<script setup lang="ts">
import Fuse from 'fuse.js'
import { storeToRefs } from 'pinia'
import SearchSVG from '~/assets/images/icons/search.svg?component'

const searchQuery = ref()

const { account } = useWeb3()
const { safeAddress } = useAvocadoSafe()
const { networkPreference } = storeToRefs(useSafe())

const { NFT } = useNft()

const route = useRoute()

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { data, pending, refresh } = useAsyncData(
  async () => {
    if (!safeAddress.value)
      return
    try {
      const nft = new NFT(route.query?.nftUser || safeAddress.value)

      return nft.getNFTs({
        pageSize: 50,
      })
    }
    catch (e) {
      console.log(e)
    }
  },
  {
    server: false,
    watch: [safeAddress],
  },
)

useIntervalFn(() => {
  refresh()
}, 10000)

const filteredAssets = computed(() => {
  const items = data.value?.filter(item =>
    networkPreference.value.has(+item.chainId as ChainId),
  )

  if (!searchQuery.value)
    return items

  const fuse = new Fuse(items || [], {
    keys: ['collectionName', 'name'],
    threshold: 0.1,
  })

  return fuse.search(searchQuery.value).map(result => result.item)
})
</script>

<template>
  <div class="flex-1 container relative">
    <div class="w-full flex items-center justify-between mb-5">
      <h1>
        Your NFTs <span v-if="data">({{ data?.length }})</span>
      </h1>
      <MultipleNetworkFilter v-if="account" />
    </div>
    <CommonInput
      v-model="searchQuery"
      placeholder="Search NFTs"
      name="search-nft"
      type="search"
      class="mb-5"
    >
      <template #prefix>
        <SearchSVG class="shrink-0 mr-2" />
      </template>
    </CommonInput>
    <div
      :class="{
        'blur dark:bg-gray-850 rounded-[25px] bg-slate-50': !data,
      }"
      class="w-[101%] h-full max-h-[750px] sm:overflow-auto sm:-mr-2 scroll-style"
    >
      <div
        v-if="!pending && data && !data.length"
        class="dark:bg-gray-850 bg-slate-50 rounded-[25px] w-full p-5"
      >
        No NFTs found
      </div>

      <ul
        v-else
        class="grid p-5 grid-cols-1 sm:grid-cols-3 dark:bg-gray-850 bg-slate-50 rounded-[25px] w-full md:grid-cols-4 gap-5 content-baseline"
      >
        <NFTCard
          v-for="asset in filteredAssets"
          :key="asset.name + asset.contractAddress + asset.tokenId"
          :asset="asset"
        />
      </ul>
    </div>
  </div>
</template>
