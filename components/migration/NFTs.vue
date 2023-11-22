<script setup lang="ts">
const { NFT } = useNft()
const { safeAddress } = useAvocadoSafe()
const { toggleSelectedNFTsForMigration, setNFTsForMigration } = useMigration()

const { data, pending } = useAsyncData(
  async () => {
    if (!safeAddress.value)
      return

    try {
      const nft = new NFT(safeAddress.value)

      return nft.getNFTs()
    }
    catch (e) {
      console.log(e)
    }
  },
  {
    server: false,
    watch: [safeAddress],
    immediate: true,
  },
)
</script>

<template>
  <div class="scroll-style overflow-auto sm:max-h-[65vh]">
    <div class="flex items-center justify-between border-b-[1px] border-slate-750 p-5 text-xs font-medium">
      <p>
        Select NFTs for migration
      </p>
      <button class="text-green-500" @click="() => setNFTsForMigration(data || [])">
        Select All
      </button>
    </div>

    <template v-if="pending">
      <MigrationLoadingNFT
        v-for="i in 4"
        :key="i"
      />
    </template>

    <MigrationNFTCard
      v-for="asset in data"
      v-else
      :key="asset.name + asset.contractAddress + asset.tokenId"
      :asset="asset"
      @toggleCheck="() => toggleSelectedNFTsForMigration(asset)"
    />
  </div>
</template>
