<script setup lang="ts">
import type { TransactionReceipt } from '@ethersproject/abstract-provider'
import { wait } from '@instadapp/utils'
import SVGCheckCircle from '~/assets/images/icons/check-circle.svg?component'

const props = defineProps<{
  hashes: string[]
  chainIds: (number | string)[]
}>()

const { getRpcProviderByChainId } = useShared()

const events = [
  '0xacb5341cc21d71a005bd22634cec7391a7fd11ff2b563a7b301cac795f7a6a56',
  '0xdaf1e6e151973de199f3ea25b9c6a7c3d94299dc85e269cfd20e48e517ecf704',
]

const transactions = ref<TransactionReceipt[]>([])

onMounted(async () => {
  await wait(5000)

  props.hashes.forEach(async (hash, index) => {
    const provider = getRpcProviderByChainId(props.chainIds[index]);
    transactions.value?.push(await provider.waitForTransaction(hash));
  })
})

const getIsSuccess = (transaction: TransactionReceipt) => {
  if (!transaction.status)
    return false

  if (transaction.logs.some(i => i.topics.length && events.includes(i.topics[0])))
    return true

  return false
}
</script>

<template>
  <div class="text-center flex flex-col gap-7.5">
    <div v-for="(hash, index) in hashes" class="mt-4 first:mt-0">
      <div v-if="transactions?.length && transactions[index]" class="flex justify-center">
        <SVGCheckCircle
          v-if="getIsSuccess(transactions[index])"
          class="text-white w-10 h-10 success-circle"
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
        <h2 class="text-lg leading-5 my-4">
          Transaction
          {{
            transactions?.length && transactions[index]
              ? getIsSuccess(transactions[index])
                ? "Confirmed"
                : "Failed"
              : "Pending"
          }}
        </h2>

        <p
          v-if="transactions?.length && transactions[index] && !getIsSuccess(transactions[index])"
          class="text-slate-400 text-xs mb-2"
        >
          Try again or return to the home page.
        </p>
      </div>

      <div class="dark:bg-slate-800 bg-slate-100 bg px-[18px] py-[14px] rounded-5 flex items-center justify-between">
        <p class="flex gap-3 items-center">
          <ChainLogo class="w-[26px] h-[26px]" :chain="chainIds[index]" />
          <span class="text-sm text-slate-400">{{ chainIdToName(chainIds[index]) }}</span>
        </p>
        <CommonButton as="a" target="_blank" :href="`${avoExplorerURL}/tx/${hash}`" size="sm">
          View Explorer
        </CommonButton>
      </div>
    </div>
  </div>
</template>
