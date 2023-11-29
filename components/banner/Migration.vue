<script setup lang="ts">
const { hideMigrationBanner } = useBanner()
</script>

<template>
  <div
    class="mb-4 flex w-full flex-col items-center justify-center gap-[15px] rounded-5 bg-primary/10 p-4 text-center text-sm text-primary sm:flex-row"
  >
    <div class="inline-flex items-center gap-2">
      <SvgoEyes />
      <span class="self-center text-xs">
        Migrate your balances to Avocado Personal to get the latest updates
      </span>
    </div>
    <CommonButton as="NuxtLink" to="/migration" class="flex h-7.5 justify-center !px-4 text-xs">
      Migrate
    </CommonButton>
    <button
      class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
      @click="hideMigrationBanner"
    >
      <SvgoX class="text-white" />
    </button>
  </div>
</template>
