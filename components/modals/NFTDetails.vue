<script setup lang="ts">
defineProps<{
  asset: NFTData;
}>();
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <NFTImage img-class="sm:h-[324px]" class="!sm:h-full" :asset="asset" />
    <div class="flex gap-3 flex-col">
      <h1 v-if="asset.name" class="text-center text-lg leading-5">
        {{ asset.name }}
      </h1>
      <h2
        v-if="asset.collectionName"
        class="text-sm text-slate-400 font-medium text-center"
      >
        {{ asset.collectionName }}
      </h2>
    </div>
    <CommonButton class="w-full justify-center" size="lg">
      Send NFT
    </CommonButton>
  </div>
</template>
