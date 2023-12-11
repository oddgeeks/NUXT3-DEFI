<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const { safeAddress } = storeToRefs(useSafe())
const { fromWei } = useBignumber()
const { avoProvider } = useSafe()
const route = useRoute()

const dryRun = useCookie<boolean | undefined>('dry-run', {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  default: () => {
    return route.query?.dryRun ? true : undefined
  },
})

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

useIntervalFn(refresh, 15000)
</script>

<template>
  <div class="hidden items-center justify-between py-8 sm:flex">
    <WalletItemList />

    <button v-if="dryRun" class="mr-4 text-sm text-orange" @click="dryRun = undefined">
      Disable Dry Run
    </button>
    <nav class="relative ml-auto flex items-center gap-4">
      <SessionLocked />
      <Web3Button />
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
