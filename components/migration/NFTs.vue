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
</script>

<template>
  <div>
    <div class="flex items-center justify-between border-b-[1px] border-slate-750 p-5 text-xs font-medium">
      <p>
        Select NFTs for migration
      </p>
      <button class="text-green-500" @click="() => setNFTsForMigration(filteredAssets || [])">
        Select All
      </button>
    </div>

    <template v-if="pending && !filteredAssets?.length">
      <MigrationLoadingNFT
        v-for="i in 4"
        :key="i"
      />
    </template>

    <MigrationNFTCard
      v-for="asset in filteredAssets"
      v-else
      :key="asset.name + asset.contractAddress + asset.tokenId"
      :asset="asset"
      @toggleCheck="() => toggleSelectedNFTsForMigration(asset)"
    />
  </div>
</template>
