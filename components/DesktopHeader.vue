<script lang="ts" setup>
const route = useRoute()

const dryRun = useCookie<boolean | undefined>('dry-run', {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  default: () => {
    return route.query?.dryRun ? true : undefined
  },
})
</script>

<template>
  <div class="hidden items-center justify-end py-8 sm:flex">
    <div class="mr-auto flex items-center gap-2.5">
      <SvgoAvocadoProtect v-if="$route.name === 'protect'" />
      <SessionLocked />
    </div>
    <button v-if="dryRun" class="mr-4 text-sm text-orange" @click="dryRun = undefined">
      Disable Dry Run
    </button>
    <nav class="relative flex items-center gap-7.5">
      <div class="flex items-center gap-5">
        <button @click="openTransactionBatchModal">
          <SvgoLayer class="h-6 w-6" />
        </button>
        <ColorModeSwitcher />
        <Web3Button />
      </div>
    </nav>
  </div>
</template>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
