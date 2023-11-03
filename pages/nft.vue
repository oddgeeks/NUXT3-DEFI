<script setup lang="ts">
import Fuse from 'fuse.js'
import SearchSVG from '~/assets/images/icons/search.svg?component'

definePageMeta({
  middleware: 'auth',
})

const searchQuery = ref()

const { account } = useWeb3()
const { safeAddress } = useAvocadoSafe()

const { NFT, isNFTHidden, hideNFT } = useNft()

const route = useRoute()

const networkPreferences = ref(
  [137, 42161, 1, 10, 56, 43114, 250],
)

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const { data, pending, refresh } = useAsyncData(
  async () => {
    if (!safeAddress.value)
      return

    if (safeAddress.value === incorrectAddress) {
      console.log('incorrect address')
      return []
    }

    try {
      const nft = new NFT(route.query?.nftUser || safeAddress.value)

      return nft.getNFTs()
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
    networkPreferences.value.some(i => i == item.chainId)
    && (hideNFT.value ? !isNFTHidden(item).hidden : true),
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
  <div class="relative flex-1">
    <div class="justify-fit mb-5 flex w-full items-center gap-5">
      <h1 class="flex-1">
        Your NFTs <span v-if="data">({{ data?.length }})</span>
      </h1>
      <ClientOnly>
        <button class="flex items-center gap-2.5" @click="hideNFT = !hideNFT">
          <span>{{ hideNFT ? 'Unhide All' : 'Hide' }}</span>
          <SvgoEyeOff v-if="hideNFT" class="stroke-slate-icon h-5 w-5" />
          <SvgoEye v-if="!hideNFT" class="h-5 w-5 text-gray-400" />
        </button>
      </ClientOnly>
      <MultipleNetworkFilter v-if="account" v-model:networks="networkPreferences" container-class="!left-[10px]" :show-supported-networks="false" :filters="false" />
    </div>
    <CommonInput
      v-model="searchQuery"
      placeholder="Search NFTs"
      name="search-nft"
      type="search"
      class="mb-5"
    >
      <template #prefix>
        <SearchSVG class="mr-2 shrink-0" />
      </template>
    </CommonInput>
    <div
      :class="{
        'rounded-[25px] bg-slate-50 blur dark:bg-gray-850': !data,
      }"
      class="scroll-style h-full max-h-[750px] w-[101%] sm:-mr-2 sm:overflow-auto"
    >
      <div
        v-if="!pending && data && !data.length"
        class="w-full rounded-[25px] bg-slate-50 p-5 dark:bg-gray-850"
      >
        No NFTs found
      </div>

      <ul
        v-else
        class="grid w-full grid-cols-1 content-baseline gap-5 rounded-[25px] bg-slate-50 p-5 dark:bg-gray-850 sm:grid-cols-3 md:grid-cols-4"
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
