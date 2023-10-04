<script setup lang="ts">
import { storeToRefs } from 'pinia'

defineProps<{
  transactionId: string
  rejection?: boolean
  chainId: number | string
}>()

defineEmits(['destroy'])

const { selectedSafe } = storeToRefs(useSafe())
</script>

<template>
  <div>
    <div
      class="inline-flex w-full flex-col items-center justify-center gap-5 text-center"
    >
      <SvgoCheckCircle
        class="success-circle h-10 w-10 text-white"
      />

      <div class="flex w-full flex-col gap-5">
        <h1 class="text-lg font-semibold">
          <template v-if="!rejection">
            Transaction Proposed
          </template>
          <template v-else>
            Rejection Transaction Proposed
          </template>
        </h1>

        <div
          class="bg flex w-full items-center justify-between rounded-5 bg-slate-100 px-[18px] py-[14px] dark:bg-slate-800"
        >
          <p class="flex items-center gap-3">
            <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
            <span class="text-sm text-slate-400">{{ chainIdToName(chainId) }}</span>
          </p>
          <CommonButton as="NuxtLink" :to="`/multisig/${selectedSafe?.safe_address}/pending-transactions/${transactionId}`" size="sm" @click="$emit('destroy')">
            View Queued Transaction
          </CommonButton>
        </div>
      </div>
    </div>
  </div>
</template>
