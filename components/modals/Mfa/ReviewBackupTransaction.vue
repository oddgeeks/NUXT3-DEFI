<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = defineProps<{
  transactionId: string
  chainId: number | string
}>()

defineEmits(['destroy'])

const { selectedSafe } = storeToRefs(useSafe())
const url = useRequestURL()

const { backupSigner } = useMfa()

const path = computed(() => `${url.origin}/2fa/${selectedSafe.value?.safe_address}/pending-transactions/${props.transactionId}`)
</script>

<template>
  <div>
    <div class="inline-flex w-full flex-col gap-5">
      <div class="flex gap-[14px]">
        <SvgoCheckCircle
          class="success-circle h-10 w-10 shrink-0 text-white"
        />
        <div class="flex flex-col gap-1">
          <h1 class="text-lg">
            Approve this transaction using Backup Address
          </h1>
          <h2 class="text-xs font-medium leading-5 text-gray-400">
            To complete this transaction, approve the transaction from <br> <span
              v-if="backupSigner" v-tippy="{
                content: backupSigner.address,
                interactive: true,
              }"
            >
              {{ shortenHash(backupSigner.address) }}
            </span> (Your Backup Address)
          </h2>
        </div>
      </div>

      <div class="flex w-full flex-col gap-5">
        <div
          class="bg flex w-full items-center justify-between rounded-5 bg-slate-100 px-4 py-3 dark:bg-gray-900"
        >
          <span class="max-w-[95%] truncate text-sm font-medium">
            {{ path }}
          </span>
          <Copy icon-only :text="path" />
        </div>
      </div>
      <CommonButton class="justify-center" size="lg" @click="$emit('destroy')">
        I Understand
      </CommonButton>
    </div>
  </div>
</template>
