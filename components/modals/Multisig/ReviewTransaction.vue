<script setup lang="ts">
import { storeToRefs } from 'pinia'

defineProps<{
  transactionId: string
  rejection?: boolean
}>()

defineEmits(['destroy'])

const { selectedSafe } = storeToRefs(useSafe())
</script>

<template>
  <div>
    <div
      class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
    >
      <SvgoCheckCircle
        class="text-white success-circle"
      />

      <div class="flex flex-col gap-[15px]">
        <h1 class="text-lg font-semibold">
          <template v-if="!rejection">
            Your transaction was successfully proposed.
          </template>
          <template v-else>
            Your transaction rejection was submitted
          </template>
        </h1>
        <NuxtLink
          :to="`/multisig/${selectedSafe?.safe_address}/pending-transactions/${transactionId}`"
          class="text-slate-400 text-xs text-center leading-5 font-medium"
          @click="$emit('destroy')"
        >
          View transaction
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
