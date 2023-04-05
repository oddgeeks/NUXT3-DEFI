<script setup lang="ts">
import Fuse from "fuse.js";
import { storeToRefs } from "pinia";
import SearchSVG from "~/assets/images/icons/search.svg?component";

const searchQuery = ref();

const { account } = useWeb3();
const { safeAddress } = useAvocadoSafe();
const { networkPreference } = storeToRefs(useSafe());

const { NFT } = useNft();

useAccountTrack(undefined, () => {
  useEagerConnect();
});

const { data, pending } = useAsyncData(
  async () => {
    if (!safeAddress.value) return;
    const nft = new NFT(safeAddress.value);

    return nft.getNFTs({
      pageSize: 50,
    });
  },
  {
    server: false,
    immediate: true,
    watch: [safeAddress],
  }
);

const filteredAssets = computed(() => {
  const items = data.value?.filter((item) =>
    networkPreference.value.has(item.chainId)
  );

  if (!searchQuery.value) return items;

  const fuse = new Fuse(items || [], {
    keys: ["collectionName", "name"],
    threshold: 0.2,
  });

  return fuse.search(searchQuery.value).map((result) => result.item);
});
</script>

<template>
  <div class="flex-1 container relative">
    <div class="w-full flex items-center justify-between mb-5">
      <h1>Your NFTs ({{ data?.length }})</h1>
      <MultipleNetworkFilter v-if="account" />
    </div>
    <CommonInput
      placeholder="Search NFTs"
      name="search-nft"
      v-model="searchQuery"
      type="search"
      class="mb-5"
    >
      <template #prefix>
        <SearchSVG class="shrink-0 mr-2" />
      </template>
    </CommonInput>
    <div
      :class="{
        blur: pending,
      }"
      class="p-5 rounded-[25px] w-full h-full sm:absolute dark:bg-gray-850 bg-slate-50 max-h-full sm:overflow-auto scroll-style"
    >
      <ul
        class="grid grid-cols-1 sm:grid-cols-3 w-full h-full md:grid-cols-5 gap-5 content-baseline"
      >
        <NFTCard
          :key="asset.name"
          v-for="asset in filteredAssets"
          :asset="asset"
        />
      </ul>
    </div>
  </div>
</template>
