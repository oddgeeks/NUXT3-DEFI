<script setup lang="ts">
import type { TransactionReceipt } from '@ethersproject/abstract-provider'
import { wait } from '@instadapp/utils'
import SVGBridge from '~/assets/images/icons/bridge-2.svg?component'
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg?component'

const props = defineProps<{
  hash: string
  chainId: number | string
  type: ITxType
}>()

const { getRpcProviderByChainId } = useShared()

const events = [
  '0xacb5341cc21d71a005bd22634cec7391a7fd11ff2b563a7b301cac795f7a6a56',
  '0xdaf1e6e151973de199f3ea25b9c6a7c3d94299dc85e269cfd20e48e517ecf704',
]

const provider = getRpcProviderByChainId(props.chainId)
const transaction = ref<TransactionReceipt>()

onMounted(async () => {
  await wait(5000)

  transaction.value = await provider.waitForTransaction(props.hash)
})

const isSuccess = computed(() => {
  if (!transaction.value?.status)
    return false

  if (transaction.value.logs.some(i => i.topics.length && events.includes(i.topics[0])))
    return true

  return false
})
</script>

<template>
  <div class="flex flex-col gap-7.5 text-center">
    <div v-if="transaction" class="flex justify-center">
      <SVGCheckCircle
        v-if="isSuccess"
        class="success-circle h-10 w-10 text-white"
      />

      <svg
        v-else
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
    </div>

    <div v-if="!transaction" class="flex justify-center">
      <svg
        class="h-10 w-10 animate-spin text-green-500"
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
      <h2 class="text-lg leading-5">
        Transaction
        {{
          transaction
            ? isSuccess
              ? "Confirmed"
              : "Failed"
            : "Pending"
        }}
      </h2>

      <p v-if="!transaction" class="mt-2 text-xs leading-5 text-gray-400">
        The transaction has been sent to be processed.
      </p>

      <p
        v-if="transaction && !isSuccess"
        class="mt-2 text-xs text-gray-400"
      >
        Try again or return to the home page.
      </p>
    </div>

    <div
      class="bg flex items-center justify-between rounded-5 bg-slate-100 px-[18px] py-[14px] dark:bg-gray-900"
    >
      <div v-if="type === 'bridge'" class="flex items-center gap-3">
        <div class="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary">
          <SVGBridge class="w-4" />
        </div>
        <span class="text-sm font-medium text-gray-400">Bridge</span>
      </div>
      <p v-else class="flex items-center gap-3">
        <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
        <span class="text-sm text-gray-400">{{ chainIdToName(chainId) }}</span>
      </p>
      <CommonButton as="a" target="_blank" :href="`${avoExplorerURL}/tx/${hash}`" size="sm">
        View Explorer
      </CommonButton>
    </div>
  </div>
</template>
