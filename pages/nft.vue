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
      walletAddress: "0x32b271D89178724141a644a6efD7fF5512Cd900a",
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
</script>

<template>
  <div class="flex-1 container">
    <div class="w-full flex items-center justify-between">
      <h1>Your NFTs (12)</h1>
      <MultipleNetworkFilter v-if="account" />
    </div>
    <div class="p-5 rounded-[25px] dark:bg-gray-850 bg-slate-50">
      <ul class="grid grid-cols-5 gap-5">
        <template :key="asset.name" v-for="asset in data?.assets">
          <li
            class="dark:bg-slate-800 bg-slate-150 p-2.5 rounded-5"
            v-if="asset?.imageUrl"
          >
            <figure>
              <img
                class="rounded-[14px]"
                width="168"
                height="160"
                :src="asset.imageUrl"
                :alt="asset.collectionName"
              />
              <figcaption>
                <span class="text-xs font-bold"> {{ asset.name }}</span>
                <span></span>
              </figcaption>
            </figure>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>
