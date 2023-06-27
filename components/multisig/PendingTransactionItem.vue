<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const props = defineProps<{
  item: IMultisigTransaction
}>()

const isConfirmationsMatch = computed(() => props.item.confirmations.length === props.item.confirmations_required)
</script>

<template>
  <li class="w-full">
    <button class="flex items-center w-full gap-10 text-xs font-medium py-[26px] last:border-b-0 border-b border-slate-150 dark:border-slate-800 px-5" @click="openMultisigTransactionDetails(item)">
      <span class="w-10">
        {{ item.nonce }}
      </span>
      <span class="flex items-center gap-2.5">
        <SvgoRefresh class="w-4 h-4 text-primary" />
        Swap
      </span>
      <span class="flex-1">
        42,022 USDT
      </span>
      <span class="whitespace-nowrap">
        {{ formatTimeAgo(new Date(item.created_at)) }}
      </span>
      <span class="flex items-center gap-2.5 w-[140px]">
        <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-slate-400'" />
        <span :class="isConfirmationsMatch ? 'text-primary' : ''">
          {{ item.confirmations.length }} out of {{ item.confirmations_required }}
        </span>
      </span>
      <div class="w-56" :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
        <span v-if="isConfirmationsMatch" class="items-center flex gap-10 justify-between">
          Ready to execute
          <SvgoCheckCircle class="success-circle w-5 h-5" />
        </span>
        <span v-else class="items-center flex gap-10 justify-between">
          Awaiting confirmations
          <span class="w-5 h-5 flex items-center justify-center">
            <SvgoHourGlass class="w-4 h-4" />
          </span>
        </span>
      </div>
    </button>
  </li>
</template>
