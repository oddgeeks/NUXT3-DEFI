<template>
  <div>
    <div class="p-5 flex items-center justify-between text-xs font-medium border-b-[1px] dark:border-slate-750 border-white">
      <p class="dark:text-white text-slate-900">Select NFTs for migration</p>
      <button class="text-green-500" @click="() => setNFTsForMigration(filteredAssets || [])">Select All</button>
    </div>

    <MigrationLoadingNFT
      v-if="pending && !filteredAssets?.length"
      v-for="i in 4"
      :key="i"
    />
    <MigrationNFTCard
      v-else
      v-for="asset in filteredAssets"
      :key="asset.name + asset.contractAddress + asset.tokenId"
      :asset="asset"
      :is-checked="isChecked(asset)"
      @toggleCheck="() => toggleSelectedNFTsForMigration(asset)"
    />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'

const { NFT } = useNft()
const { legacySafeAddress } = storeToRefs(useSafe())
const { toggleSelectedNFTsForMigration, setNFTsForMigration } = useMigration()
const { selectedNFTsForMigration } = storeToRefs(useMigration())

const networkPreferences = ref(
  [137, 42161, 1, 10, 56, 43114, 250],
)

const { data, pending, refresh } = useAsyncData(
  async () => {
    if (!legacySafeAddress.value)
      return

    if (legacySafeAddress.value === incorrectAddress) {
      console.log('incorrect address')
      return []
    }

    try {
      const nft = new NFT(legacySafeAddress.value)

      return nft.getNFTs()
    }
    catch (e) {
      console.log(e)
    }
  },
  {
    server: false,
    watch: [legacySafeAddress],
  },
)

useIntervalFn(() => {
  refresh()
}, 10000)

const filteredAssets = computed(() => {
  return data.value?.filter(item =>
    networkPreferences.value.some(i => i == item.chainId),
  )
})
 
const isChecked = (asset: NFTData) => {
  const index = selectedNFTsForMigration.value?.findIndex((selectedNFT) => {
    return `${selectedNFT.tokenId}-${selectedNFT.chainId}` === `${asset.tokenId}-${asset.chainId}`
  })
  return index > -1
}
</script>