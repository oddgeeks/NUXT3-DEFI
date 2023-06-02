<template>
  <Transition name="slide-fade">
    <div v-if="$pwa.needRefresh" class="flex z-[100] items-center gap-[15px] sm:max-w-[400px] w-full bg-[#4CA054] dark:bg-[#4CA054] dark:bg-opacity-60 bg-opacity-30 backdrop-blur px-5 rounded-5 pr-7.5 py-4 fixed left-1/2 transform -translate-x-1/2 bottom-[50px]">
      <SvgoGear />
      <p class="text-xs leading-5 flex-1 dark:text-white text-slate-900">
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
