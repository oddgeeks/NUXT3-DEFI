<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'

const props = defineProps<{
  item: IMultisigTransaction
  activeTab: string
}>()

const route = useRoute()

const isConfirmationsMatch = computed(() => props.item.confirmations.length === props.item.confirmations_required)
const isTransactionExecuted = computed(() => props.item.executed_at !== null)
const isTransactionFailed = computed(() => props.item.status === 'failed')

const firstActionMetadata = computed<any>(() => {
  const data = decodeMetadata(props.item.data.params.metadata) as string[]

  return data?.length ? data[0] : ''
})

const actionType = computed(() => firstActionMetadata.value?.type || '')

const formattedActionType = computed(() => {
  return formatTxType(actionType.value || '')
})

async function handleClick(item: IMultisigTransaction) {
  window.history.replaceState({}, '', `pending-transactions/${item.id}`)
  await openMultisigTransactionDetails(item)
  window.history.replaceState({}, '', route.fullPath)
}
</script>

<template>
  <li class="w-full">
    <button class="flex focus:outline-none items-center w-full gap-10 text-xs font-medium py-[26px] last:border-b-0 border-b border-slate-150 dark:border-slate-800 px-5" @click="handleClick(item)">
      <span v-if="activeTab !== 'non-seq'" :class="item.nonce === '-1' ? 'invisible' : ''">
        {{ item.nonce }}
      </span>
      <span class="flex items-center gap-2.5 whitespace-nowrap w-[130px]">
        <ActionLogo class="shrink-0" :action="actionType" />
        <span>{{ formattedActionType }}</span>
      </span>
      <span class="flex-1 flex-col flex gap-2">
        <ActionMetadata v-for="metadata in decodeMetadata(item.data.params.metadata)" v-once :key="metadata" class="text-left" compact :chain_id="item.chain_id" :metadata="metadata" />
      </span>
      <span class="whitespace-nowrap">
        {{ formatTimeAgo(new Date(activeTab === 'completed' ? item.executed_at : item.created_at)) }}
      </span>
      <span class="flex items-center gap-2.5 w-[120px]">
        <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-slate-400'" />
        <span :class="isConfirmationsMatch ? 'text-primary' : ''">
          {{ item.confirmations.length }} out of {{ item.confirmations_required }}
        </span>
      </span>
      <div class="w-56">
        <div :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
          <span v-if="isTransactionFailed" class="flex items-center text-red-alert gap-2">
            Failed
            <SvgoErrorCircle class="text-white w-5 h-5" />
          </span>
          <span v-else-if="isTransactionExecuted" class="flex items-center gap-2">
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
      </div>
    </button>
  </li>
</template>
