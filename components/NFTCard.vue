<script setup lang="ts">
const props = defineProps<{
  asset: NFTData;
}>();
</script>

<template>
  <li class="dark:bg-slate-800 bg-slate-150 rounded-5" v-if="asset.imageUrl">
    <button
      @click="openNFTDetailsModal(asset)"
      class="w-full p-2.5 h-full text-left focus:outline-none rounded-[inherit] focus-within:ring-1 dark:ring-slate-150 ring-slate-800 dark:ring-opacity-10 ring-opacity-10"
    >
      <figure class="h-full w-full flex flex-col gap-2.5">
        <NFTImage :asset="asset" />
        <figcaption class="flex-1 flex flex-col px-2">
          <span v-if="asset.name" class="text-xs font-bold leading-5">
            {{ asset.name }}
          </span>
          <span
            v-if="asset.collectionName"
            class="text-xs text-slate-400 font-medium leading-5"
          >
            {{ asset.collectionName }}
          </span>
        </figcaption>
      </figure>
    </button>
  </li>
</template>
