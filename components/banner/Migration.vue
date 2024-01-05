<script setup lang="ts">
const { hideMigrationBanner } = useBanner()
</script>

<template>
  <div
    class="relative mb-4 flex w-full flex-col items-center justify-center rounded-5 bg-primary/10 p-4 text-center text-sm text-primary sm:flex-row"
  >
    <div class="flex items-center gap-[15px]">
      <SvgoEyes />
      <span class="self-center text-xs">
        Migrate your balances to Avocado Personal to get the latest updates
      </span>
      <CommonButton as="NuxtLink" to="/migration" class="flex h-7.5 justify-center !px-4 text-xs">
        Migrate
      </CommonButton>
    </div>
    <button
      class="absolute right-5 flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
      @click="hideMigrationBanner"
    >
      <SvgoX class="h-2.5 w-2.5 text-white" />
    </button>
  </div>
</template>
