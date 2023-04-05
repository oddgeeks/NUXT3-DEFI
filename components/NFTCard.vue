<script setup lang="ts">
import BrokenSVG from "~/assets/images/icons/broken.svg?component";

defineProps({
  asset: {
    type: Object,
    required: true,
  },
});

const error = ref(false);

const handleError = (e) => {
  error.value = true;
};
</script>

<template>
  <li
    class="dark:bg-slate-800 bg-slate-150 p-2.5 rounded-5"
    v-if="asset?.imageUrl"
  >
    <figure class="h-full flex flex-col gap-2.5">
      <div class="relative w-full">
        <div
          class="dark:bg-gray-850 bg-slate-50 rounded-[14px] w-full h-full sm:w-[168] sm:h-[160px] flex justify-center items-center"
          v-if="error"
        >
          <BrokenSVG />
        </div>
        <img
          v-else
          class="rounded-[14px] w-full h-full sm:w-[168] sm:h-[160px] object-cover"
          width="168"
          height="160"
          @error="handleError"
          :src="asset.imageUrl"
          :alt="asset.collectionName"
        />
        <div
          class="backdrop-blur-[20px] absolute left-1.5 bottom-1.5 w-fit leading-[18px] text-xs items-center flex gap-1.5 p-1.5 rounded-10 bg-black bg-opacity-30"
        >
          <ChainLogo class="shrink-0 w-5" chain="1" />
          <span class="shrink-0 mr-1"> ETH </span>
        </div>
      </div>
      <figcaption class="flex-1 flex items-center px-2">
        <span class="text-xs font-bold leading-5"> {{ asset.name }}</span>
        <span></span>
      </figcaption>
    </figure>
  </li>
</template>
