<script setup lang="ts">
import { wait } from '@instadapp/utils'
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'

const props = defineProps<{
  avocadoHash: string
  fromChainId: number | string
  toChainId: number | string
}>()

const { avoProvider } = useSafe()

const { data: crossTx, error } = useAsyncData<ICrossChainTx>('cross-tx-details', async () => {
  await wait(5000)

  let count = 0

  while (count < 150) {
    const tx = await avoProvider.send('api_getCrosschainTransaction', [
      props.avocadoHash,
    ]) as ICrossChainTx

    if (tx?.status === 'success')
      return tx

    if (tx?.source_error)
      throw new Error(tx.source_error)

    if (tx?.target_error)
      throw new Error(tx.target_error)

    if (tx?.source_transaction_hash) {
      const provider = getRpcProvider(props.fromChainId)

      await provider.waitForTransaction(tx?.source_transaction_hash)
    }

    if (tx?.target_transaction_hash) {
      const provider = getRpcProvider(props.toChainId)

      await provider.waitForTransaction(tx?.target_transaction_hash)
    }

    count++
    await wait(1000)
  }

  throw new Error('Transaction failed')
}, {
  immediate: true,
})

const status = computed(() => crossTx.value?.status)

const isFailed = computed(() => status.value === 'failed' || !!error.value)
const isSuccess = computed(() => status.value === 'success' && !error.value)
const isPending = computed(() => !isFailed.value && !isSuccess.value)

const statusLabel = computed(() => {
  if (isSuccess.value)
    return 'Success'

  if (isFailed.value)
    return 'Failed'

  return 'Pending'
})

onUnmounted(() => {
  clearNuxtData('cross-tx-details')
})
</script>

<template>
  <div class="text-center flex flex-col gap-7.5 items-center">
    <div v-if="isSuccess" class="flex justify-center">
      <SVGCheckCircle
        class="text-white w-10 h-10 success-circle"
      />
    </div>

    <svg
      v-else-if="isFailed"
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="40" height="40" rx="20" fill="#EB5757" />
      <path
        d="M25 15L15 25"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M15 15L25 25"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div v-else class="flex justify-center">
      <svg
        class="animate-spin h-10 w-10 text-green-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <div>
      <h2 class="text-lg leading-6">
        Cross Chain <br>
        Transaction {{ statusLabel }}
      </h2>

      <p v-if="isPending" class="text-slate-400 text-xs leading-5 mt-3 font-medium">
        The transaction has been sent to be processed.
      </p>

      <p v-if="isFailed" class="text-slate-400 text-xs leading-5 mt-3 font-medium">
        Try again or return to the home page.
      </p>

      <div class="flex gap-2.5 items-center mt-7.5">
        <div class="dark:bg-slate-800 flex-1 bg-slate-100 py-[14px] px-4.5 flex gap-3 rounded-5 items-center">
          <ChainLogo class="w-[26px]" :chain="fromChainId" />
          <span class="text-slate-400 text-sm"> {{ chainIdToName(fromChainId) }}</span>
        </div>
        <ArrowRight class="text-slate-500" />
        <div class="dark:bg-slate-800 flex-1 bg-slate-100 py-[14px] px-4.5 flex gap-3 rounded-5 items-center">
          <ChainLogo class="w-[26px]" :chain="toChainId" />
          <span class="text-slate-400 text-sm"> {{ chainIdToName(toChainId) }}</span>
        </div>
      </div>

      <CommonButton size="lg" class="mt-7.5 w-full justify-center" as="a" target="_blank" :href="`${avoExplorerURL}/tx/${avocadoHash}`">
        View Explorer
      </CommonButton>

      <CommonNotification v-if="!!error?.message" class="mt-7.5 h-auto" type="error" :text="error?.message" />
    </div>
  </div>
</template>
