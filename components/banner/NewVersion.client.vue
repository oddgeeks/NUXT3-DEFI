<template>
  <Transition name="slide-fade">
    <div v-if="$pwa.needRefresh" class="fixed bottom-[50px] left-1/2 z-[100] flex w-full -translate-x-1/2 items-center gap-[15px] rounded-5 bg-[#4CA054] bg-opacity-30 px-5 py-4 pr-7.5 backdrop-blur dark:bg-[#4CA054] dark:bg-opacity-60 sm:max-w-[400px]">
      <SvgoGear />
      <p class="flex-1 text-xs leading-5 text-slate-900 dark:text-white">
        New version available.
      </p>
      <CommonButton @click="$pwa.updateServiceWorker(true)">
        Reload
      </CommonButton>
    </div>
  </Transition>
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
