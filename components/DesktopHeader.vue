<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const { showVersionUpdateBanner } = useBanner()
const { safeAddress } = storeToRefs(useSafe())
const { fromWei } = useBignumber()
const { avoProvider } = useSafe()

const { refresh } = useAsyncData(
  'pending-deposit',
  async () => {
    if (!safeAddress.value)
      return '0'

    const amountInWei = await avoProvider.send('eth_getBalance', [
      safeAddress.value,
      'pending-deposit',
    ])

    return fromWei(amountInWei || '0', 18).toFixed()
  },
  {
    immediate: true,
    server: false,
    watch: [safeAddress],
  },
)

useIntervalFn(refresh, 30000)
</script>

<template>
  <div class="items-center justify-end py-8 hidden sm:flex">
    <nav class="flex items-center gap-7.5 relative">
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
        <Web3Button />
      </div>

      <Transition name="slide-fade">
        <WarningsVersionUpdate v-if="showVersionUpdateBanner && $router.currentRoute.value.name !== 'upgrade'" />
      </Transition>
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
