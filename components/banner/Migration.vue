<script setup lang="ts">
const { isMigrationBannerVisible, hideMigrationBanner } = useBanner()
</script>

<template>
  <ClientOnly>
    <Transition name="slide-fade">
      <div
        v-if="isMigrationBannerVisible"
        class="fixed bottom-[50px] left-1/2 z-10 flex w-full -translate-x-1/2 items-center gap-[15px] rounded-5 bg-primary/10 px-5 py-4 pr-7.5 backdrop-blur sm:max-w-[500px]"
      >
        <SvgoArrowRight />
        <p class="flex-1 text-xs leading-5 text-primary">
          Migrate your balances to Avocado Personal to get the latest updates
        </p>
        <CommonButton as="NuxtLink" to="/migration">
          Migrate
        </CommonButton>
        <button
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20"
          @click="hideMigrationBanner"
        >
          <SvgoX class="text-white" />
        </button>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style scoped>
.slide-fade-enter-active {
    transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
    transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    bottom: -20px;
    opacity: 0;
}
</style>
