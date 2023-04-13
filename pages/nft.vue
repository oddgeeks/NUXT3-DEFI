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
    try {
      const nft = new NFT("0x2e8ABfE042886E4938201101A63730D04F160A82");

      return nft.getNFTs({
        pageSize: 50,
      });
    } catch (e) {
      console.log(e);
    }
  },
  {
    server: false,
    watch: [safeAddress],
  }
);

const filteredAssets = computed(() => {
  const items = data.value?.filter((item) =>
    networkPreference.value.has(+item.chainId as ChainId)
  );

  if (!searchQuery.value) return items;

  const fuse = new Fuse(items || [], {
    keys: ["collectionName", "name"],
    threshold: 0.1,
  });

  return fuse.search(searchQuery.value).map((result) => result.item);
});
</script>

<template>
  <div class="flex-1 container relative">
    <div class="w-full flex items-center justify-between mb-5">
      <h1>
        Your NFTs <span v-if="!pending && data">({{ data?.length }})</span>
      </h1>
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
        'blur dark:bg-gray-850 rounded-[25px] bg-slate-50': pending || !data,
      }"
      class="w-full h-full max-h-[750px] sm:overflow-auto scroll-style"
    >
      <div
        class="dark:bg-gray-850 bg-slate-50 rounded-[25px] w-full p-5"
        v-if="!pending && data && !data.length"
      >
        No NFTs found
      </div>

      <ul
        v-else
        class="grid p-5 grid-cols-1 sm:grid-cols-3 dark:bg-gray-850 bg-slate-50 rounded-[25px] w-full md:grid-cols-5 gap-5 content-baseline"
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
