<script setup lang="ts">
import { storeToRefs } from 'pinia'

defineProps<{
  transactionId: string
  rejection?: boolean
  chainId: number | string
}>()

defineEmits(['destroy'])

const { selectedSafe } = storeToRefs(useSafe())

const { isAvocadoProtectActive } = useMfa()
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
          class="bg flex w-full items-center justify-between rounded-5 bg-gray-900 px-[18px] py-[14px]"
        >
          <p class="flex items-center gap-3">
            <ChainLogo class="h-[26px] w-[26px]" :chain="chainId" />
            <span class="text-sm text-gray-400">{{ chainIdToName(chainId) }}</span>
          </p>
          <CommonButton as="NuxtLink" :to="`/${isAvocadoProtectActive ? '2fa' : 'multisig'}/${selectedSafe?.safe_address}/pending-transactions/${transactionId}`" size="sm" @click="$emit('destroy')">
            View Queued Transaction
          </CommonButton>
        </div>
      </div>
    </div>
  </div>
</template>
