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
  <header class="flex justify-between items-center">
    <NuxtLink to="/">
      <Logo />
    </NuxtLink>

    <nav class="flex items-center gap-7.5 relative">
      <div class="flex text-sm">
        <NuxtLink
          active-class="dark:text-white text-slate-900"
          class="text-slate-400 py-3 px-5"
          to="/"
        >
          Home
        </NuxtLink>
        <NuxtLink
          v-if="account"
          active-class="dark:text-white text-slate-900"
          class="text-slate-400 py-3 px-5"
          external
          target="_blank"
          :to="`${avoExplorerURL}/address/${account}`"
        >
          History
        </NuxtLink>
        <NuxtLink
          v-if="account"
          active-class="dark:text-white text-slate-900"
          class="text-slate-400 py-3 px-5"
          to="/contacts"
        >
          Contacts
        </NuxtLink>
      </div>
      <div class="flex items-center gap-5">
        <ColorModeSwitcher />
        <Web3Button />
      </div>
      <Transition name="slide-fade">
        <WarningsVersionUpdate v-if="showVersionUpdateBanner" />
      </Transition>
    </nav>
  </header>
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
