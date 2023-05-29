<script lang="ts" setup>
const { account } = useWeb3()
const { showVersionUpdateBanner } = useBanner()
const { avoProvider } = useSafe()
const { fromWei } = useBignumber()

const { refresh } = useAsyncData(
  'pending-deposit',
  async () => {
    if (!account.value)
      return '0'

    const amountInWei = await avoProvider.send('eth_getBalance', [
      account.value,
      'pending-deposit',
    ])

    return fromWei(amountInWei || '0', 18).toFixed()
  },
  {
    immediate: true,
    server: false,
    watch: [account],
  },
)

useIntervalFn(refresh, 1000)
</script>

<template>
  <div class="items-center justify-end py-8 hidden sm:flex">
    <NuxtLink v-if="$router.currentRoute.value.meta.hideSidebar" class="mr-auto" to="/">
      <Logo />
    </NuxtLink>
    <nav class="flex items-center gap-7.5 relative">
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
        <Web3Button v-if="!$router.currentRoute.value.meta.hideSidebar"/>
      </div>
      <Transition name="slide-fade">
        <WarningsVersionUpdate v-if="showVersionUpdateBanner" />
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
