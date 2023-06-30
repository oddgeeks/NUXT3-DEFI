<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  item: IMultisigTransaction
}>()

const { selectedSafe } = storeToRefs(useAuthorities())

const isConfirmationsMatch = computed(() => props.item.confirmations.length === props.item.confirmations_required)
const isTransactionExecuted = computed(() => props.item.executed_at !== null)

const firstActionMetadata = computed<any>(() => {
  const data = decodeMetadata(props.item.data.params.metadata) as string[]

  return data?.length ? data[0] : ''
})

const actionType = computed(() => firstActionMetadata.value?.type || '')

const formattedActionType = computed(() => {
  if (isRejection.value)
    return 'On-chain rejection'

  return formatTxType(actionType.value || '')
})

const isRejection = computed(() => {
  const [action] = props.item?.data?.params?.actions || []
  if (!action)
    return false

  return action.data === '0x' && action.value == '0' && action.target === selectedSafe.value?.safe_address
})
</script>

<template>
  <li class="w-full">
    <button class="flex focus:outline-none items-center w-full gap-10 text-xs font-medium py-[26px] last:border-b-0 border-b border-slate-150 dark:border-slate-800 px-5" @click="openMultisigTransactionDetails(item, isRejection)">
      <span v-if="item.nonce !== '-1'" class="w-10">
        {{ item.nonce }}
      </span>
      <span class="flex items-center gap-2.5">
        <SvgoErrorCircle v-if="isRejection" class="w-4 h-4 text-white" />
        <ActionIcon v-else :action="actionType" />
        <span>{{ formattedActionType }}</span>
      </span>
      <span class="flex-1">
        <ActionMetadata v-for="metadata in decodeMetadata(item.data.params.metadata)" :key="metadata" compact :chain_id="item.chain_id" :metadata="metadata" />
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
        <span v-if="isTransactionExecuted" class="flex items-center gap-2">
          Executed
          <SvgoCheckCircle class="success-circle w-5 h-5" />
        </span>
        <span v-else-if="isConfirmationsMatch" class="items-center flex gap-10 justify-between">
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
