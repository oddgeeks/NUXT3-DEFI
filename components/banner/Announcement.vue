<script setup lang="ts">
const { hideAnnouncementBanner } = useBanner()
</script>

<template>
  <div class="sticky top-0 z-[41] inline-flex w-full flex-col items-center justify-center gap-1 bg-[#08884e] p-2 text-center text-xs sm:top-0 sm:h-7.5 sm:flex-row sm:p-0">
    <span>
      We are excited to announce support for Scroll, opBNB, and Fuse on Avocado!
    </span>
    <button class="underline" type="button" @click="openSupportedNetworks()">
      View all supported chains
    </button>
    <button class="absolute right-2 sm:right-4" type="button" @click="hideAnnouncementBanner()">
      <SvgoX class="h-3 w-3" />
    </button>
  </div>
</template>
