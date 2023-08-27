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
      class="inline-flex gap-5 flex-col items-center justify-center text-center w-full"
    >
      <SvgoCheckCircle
        class="text-white w-10 h-10 success-circle"
      />

      <div class="flex flex-col gap-5 w-full">
        <h1 class="text-lg font-semibold">
          <template v-if="!rejection">
            Transaction Proposed
          </template>
          <template v-else>
            Rejection Transaction Proposed
          </template>
        </h1>

        <div
          class="dark:bg-slate-800 w-full bg-slate-100 bg px-[18px] py-[14px] rounded-5 flex items-center justify-between"
        >
          <p class="flex gap-3 items-center">
            <ChainLogo class="w-[26px] h-[26px]" :chain="chainId" />
            <span class="text-sm text-slate-400">{{ chainIdToName(chainId) }}</span>
          </p>
          <CommonButton as="NuxtLink" :to="`/multisig/${selectedSafe?.safe_address}/pending-transactions/${transactionId}`" size="sm" @click="$emit('destroy')">
            View Transaction
          </CommonButton>
        </div>
      </div>
    </div>
  </div>
</template>
