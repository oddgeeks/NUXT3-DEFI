<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())
const { isMultisigOnboardBannerVisible, hideMultisigOnboardBanner } = useBanner()
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="isMultisigOnboardBannerVisible" class="flex z-[100] items-center gap-[15px] sm:max-w-[500px] w-full bg-[#4CA054] dark:bg-[#4CA054] dark:bg-opacity-60 bg-opacity-30 backdrop-blur px-5 rounded-5 pr-7.5 py-4 fixed left-1/2 transform -translate-x-1/2 bottom-[50px]">
      <SvgoGear />
      <p class="text-xs leading-5 flex-1 dark:text-white text-slate-900">
        Configure your multisig wallet to get access to all the features
      </p>
      <CommonButton as="NuxtLink" :to="`/multisig/${selectedSafe?.safe_address}/signers`" @click="hideMultisigOnboardBanner">
        Setup
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
