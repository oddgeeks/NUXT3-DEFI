<script setup lang="ts">
const { hideAnnouncementBanner } = useBanner()
</script>

<template>
  <div class="sticky top-0 z-[41] flex h-7.5 w-full items-center justify-center gap-1 bg-[#08884e] text-center text-xs">
    <span>
      Announcing support for Scroll, opBNB and Fuse on Avocado
    </span>
    <button class="underline" type="button" @click="openSupportedNetworks()">
      View all supported chains
    </button>
    <button class="absolute right-4" type="button" @click="hideAnnouncementBanner()">
      <SvgoX class="h-3 w-3" />
    </button>
  </div>
</template>
