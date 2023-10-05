<script lang="ts" setup>
import { storeToRefs } from 'pinia'

const { safeAddress, selectedSafe } = storeToRefs(useSafe())
const { fromWei } = useBignumber()
const { avoProvider } = useSafe()
const route = useRoute()

const dryRun = useCookie<boolean | undefined>('dry-run', {
  expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  default: () => {
    return route.query?.dryRun ? true : undefined
  },
})

const formattedTime = ref()

function formatCountDown() {
  const transactionTokenExpiry = useCookie<string | undefined>(`transaction-token-expiry-${selectedSafe.value?.safe_address}`)

  if (!transactionTokenExpiry.value) {
    formattedTime.value = undefined
    return
  }

  const date = new Date(transactionTokenExpiry.value)
  const now = new Date()

  // find diff in min and second like 10:12 should be 10 min and 12 sec
  const diff = Math.floor((date.getTime() - now.getTime()))
  const ms = Number(diff) || 0

  const timeInSeconds = ms / 1000
  const hours = Math.floor((timeInSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds - hours * 3600 - minutes * 60)

  const mDisplay = String(minutes).padStart(2, '0')
  const sDisplay = String(seconds).padStart(2, '0')

  formattedTime.value = `${mDisplay}:${sDisplay}`
}

useIntervalFn(() => formatCountDown(), 1000)

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
  <div class="hidden items-center justify-end py-8 sm:flex">
    <div class="mr-auto flex items-center gap-2.5">
      <SvgoAvocadoProtect v-if="$route.name === 'protect'" />
      <span v-if="formattedTime" class="flex items-center gap-1.5 rounded-lg bg-primary/10 px-1.5 py-0.5 text-sm font-medium text-primary">
        <SvgoShield class="h-4 w-4 shrink-0" />
        {{ formattedTime }}
      </span>
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
</style>
