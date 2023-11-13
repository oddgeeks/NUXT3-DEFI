<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())
const { isMultisigOnboardBannerVisible, hideMultisigOnboardBanner } = useBanner()
</script>

<template>
  <Transition name="slide-fade">
    <div v-if="isMultisigOnboardBannerVisible" class="fixed bottom-[50px] left-1/2 z-10 flex w-full -translate-x-1/2 items-center gap-[15px] rounded-5 bg-[#4CA05470] px-5 py-4 pr-7.5 backdrop-blur sm:max-w-[500px]">
      <SvgoGear />
      <p class="flex-1 text-xs leading-5">
        Configure your multisig wallet to get access to all the features
      </p>
      <CommonButton as="NuxtLink" :to="`/multisig/${selectedSafe?.safe_address}/signers`">
        Setup
      </CommonButton>
      <button
        class="flex h-5 w-5 items-center justify-center rounded-full bg-white bg-opacity-20"
        @click="hideMultisigOnboardBanner"
      >
        <SvgoX class="text-white" />
      </button>
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
