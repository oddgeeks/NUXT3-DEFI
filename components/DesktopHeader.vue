<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const { safeAddress, allSafes } = storeToRefs(useSafe())
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

const firstThreeSafe = computed(() => {
  return allSafes.value.slice(0, 3)
})

useIntervalFn(refresh, 15000)
</script>

<template>
  <div class="hidden items-center justify-end py-8 sm:flex">
    <div class="flex items-center gap-4">
      <TransitionGroup name="list">
        <WalletItem v-for="safe in firstThreeSafe" :key="safe.id" :safe="safe" />
      </TransitionGroup>
      <button class="flex h-[44px] w-full items-center justify-center gap-2.5 rounded-7.5 border border-slate-150 bg-slate-150 px-[14px] py-1 text-left text-xs dark:border-slate-750 dark:bg-gray-850">
        All
        <SvgoChevronDown class="h-3.5 w-3.5 -rotate-90" />
      </button>
    </div>
    <div class="mr-auto flex items-center gap-2.5">
      <SvgoAvocadoProtect v-if="$route.name === 'protect'" />
      <SessionLocked />
    </div>
    <button v-if="dryRun" class="mr-4 text-sm text-orange" @click="dryRun = undefined">
      Disable Dry Run
    </button>
    <nav class="relative flex items-center gap-7.5">
      <div class="flex items-center gap-5">
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

.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute;
}
</style>
