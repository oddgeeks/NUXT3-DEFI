<script setup lang="ts">
import { AnkrProvider } from "@ankr.com/ankr.js";

const { account } = useWeb3();
const { safeAddress } = useAvocadoSafe();

const provider = new AnkrProvider();

useAccountTrack(undefined, () => {
  useEagerConnect();
});

const { data } = useAsyncData(
  async () => {
    const nfts = await provider.getNFTsByOwner({
      walletAddress: "0x2e8ABfE042886E4938201101A63730D04F160A82",
      pageSize: 50,
    });

    return nfts;
  },
  {
    server: false,
    immediate: true,
    watch: [safeAddress],
  }
);

const handleError = (e) => {
  // delete the image url
  e.target.src = "";
};
</script>

<template>
  <div class="flex-1 container">
    <div class="w-full flex items-center justify-between">
      <h1>Your NFTs (12)</h1>
      <MultipleNetworkFilter v-if="account" />
    </div>
    <div
      class="p-5 rounded-[25px] dark:bg-gray-850 bg-slate-50 sm:max-h-screen sm:overflow-auto scroll-style"
    >
      <ul class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-5">
        <NFTCard
          :key="asset.name"
          v-for="asset in data?.assets"
          :asset="asset"
        />
      </ul>
    </div>
  </div>
</template>
