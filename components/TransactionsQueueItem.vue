<script setup lang="ts">
import type { TransactionReceipt } from '@ethersproject/abstract-provider'
import { wait } from '@instadapp/utils'

const props = defineProps<{
  transactionParam: IPendingTransactionModalParams
}>()
enum TransactionStatus {
  Pending = 'pending',
  Failed = 'failed',
  Success = 'success',
}
const { getRpcProviderByChainId } = useShared()
const { avoProvider } = useSafe()
const transaction = ref<TransactionReceipt>()
const crossTransaction = ref<ICrossChainTx>()
const isCrossTransactionFetching = ref(true)
const transactionPending = ref(true)
const isSuccess = computed(() => status.value === TransactionStatus.Success)
const { avoExplorerURL } = storeToRefs(useEnvironmentState())

const events = [
  '0xacb5341cc21d71a005bd22634cec7391a7fd11ff2b563a7b301cac795f7a6a56',
  '0xdaf1e6e151973de199f3ea25b9c6a7c3d94299dc85e269cfd20e48e517ecf704',
]
const provider = getRpcProviderByChainId(props.transactionParam.chainId)
async function waitForTransaction() {
  try {
    await wait(5000)
    transaction.value = await provider.waitForTransaction(props.transactionParam.hash)
  }
  finally {
    transactionPending.value = false
  }
}
async function waitForCrossTransaction() {
  await wait(5000)
  while (isCrossTransactionFetching.value) {
    const tx = await avoProvider.send('api_getCrosschainTransaction', [
      props.transactionParam.hash,
    ]) as ICrossChainTx
    crossTransaction.value = tx
    await wait(3000)
  }
}
const status = computed(() => {
  if (props.transactionParam.crossChain) {
    if (crossTransaction.value?.status === TransactionStatus.Success) {
      isCrossTransactionFetching.value = false
      return TransactionStatus.Success
    }
    if (crossTransaction.value?.status === TransactionStatus.Failed) {
      isCrossTransactionFetching.value = false
      return TransactionStatus.Failed
    }
    return TransactionStatus.Pending
  }
  else {
    if (transactionPending.value)
      return TransactionStatus.Pending
    if ((!transactionPending.value && !transaction) || !transaction.value?.status)
      return TransactionStatus.Failed
    if (transaction.value.logs.some(i => i.topics.length && events.includes(i.topics[0])))
      return TransactionStatus.Success
    return TransactionStatus.Failed
  }
})
function handleAnimationEnd() {
  removeTransactionFromQueue(props.transactionParam.hash)
}
onMounted(() => {
  props.transactionParam.crossChain
    ? waitForCrossTransaction()
    : waitForTransaction()
})
</script>

<template>
  <div
    class="wrapper relative flex flex-col gap-3 overflow-hidden rounded-5 border border-gray-800 bg-gray-850 p-4 sm:w-[400px]"
  >
    <div
      v-if="isSuccess && !transactionParam.preventAutoClose" class="countdown-animation absolute bottom-0 left-0 h-1 w-full bg-primary"
      @animationend="handleAnimationEnd"
    />
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="flex items-center gap-2">
          <ChainLogo class="h-5 w-5" :chain="transactionParam.chainId" />
          <span class="text-xs">
            {{ chainIdToName(transactionParam.chainId) }}
          </span>
        </div>
        <SvgoArrowRight
          v-if="transactionParam.crossChain && transactionParam.toChainId"
          class="h-3 w-3 text-gray-400"
        />
        <div v-if="transactionParam.toChainId" class="flex items-center gap-2.5">
          <ChainLogo class="h-5 w-5" :chain="transactionParam.toChainId" />
          <span class="text-xs">
            {{ chainIdToName(transactionParam.toChainId) }}
          </span>
        </div>
        <span v-if="!transactionParam.crossChain" class="inline-flex gap-1.5 text-xs text-gray-400">
          {{ shortenHash(transactionParam.hash) }}
          <Copy icon-class="w-3" :text="transactionParam.hash" icon-only />
        </span>
      </div>
      <button
        class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800"
        aria-label="Close modal" @click="removeTransactionFromQueue(transactionParam.hash)"
      >
        <SvgoX class="h-2.5 w-2.5" />
      </button>
    </div>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <template v-if="status === TransactionStatus.Pending">
          <SvgSpinner class="text-primary" />
          <span class="text-xs">
            Transaction Pending
          </span>
        </template>
        <template v-if="status === TransactionStatus.Failed">
          <SvgoErrorCircle class="h-5 w-5" />
          <span class="text-xs">
            Transaction Failed
          </span>
        </template>
        <template v-if="status === TransactionStatus.Success">
          <SvgoCheckCircle class="success-circle h-5 w-5" />
          <span class="text-xs">
            Transaction Confirmed
          </span>
        </template>
      </div>
      <NuxtLink
        target="_blank" external :to="`${avoExplorerURL}/tx/${transactionParam.hash}`"
        class="inline-flex items-center gap-0.5 text-xs text-primary"
      >
        View Explorer
        <SvgoChevronDown class="w-4 -rotate-90" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.wrapper:hover .countdown-animation {
    animation-play-state: paused;
}

.countdown-animation {
    animation: countdown 5200ms linear forwards;
    transform-origin: left center;
}

@keyframes countdown {
    0% {
        transform: scaleX(1);
    }

    100% {
        transform: scaleX(0);
    }
}
</style>
