<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { getAddress } from 'ethers/lib/utils'
import { AvoMultisigImplementation__factory } from '@/contracts'

const props = defineProps<{
  item: IMultisigTransaction
  activeTab: string | undefined
}>()

const route = useRoute()
const { account } = useWeb3()

const isConfirmationsMatch = computed(() => props.item.confirmations.length === props.item.confirmations_required)
const isYourSignNeeded = computed(() => !account.value ? false : !props.item.confirmations.find(item => getAddress(account.value) === getAddress(item.address)))
const isTransactionExecuted = computed(() => props.item.executed_at !== null)
const isTransactionFailed = computed(() => props.item.status === 'failed')

const firstActionMetadata = computed<any>(() => {
  const metadata = props.item.data.params.metadata
  const data = decodeMetadata(metadata) as string[]

  const avoMultsigInterface = AvoMultisigImplementation__factory.createInterface()
  try {
    for (const action of props.item.data.params.actions) {
      const payload = avoMultsigInterface.decodeFunctionData('occupyNonSequentialNonces', action.data)
      if (payload) {
        const [ids] = payload

        return {
          type: 'rejection',
          id: ids[0],
        }
      }
    }
  }
  catch (error) {
    // console.log(error)
  }

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
    <button class="flex focus:outline-none items-center w-full gap-10 text-xs font-medium py-4 last:border-b-0 border-b border-slate-150 dark:border-slate-800 px-5" @click="handleClick(item)">
      <span v-if="activeTab !== 'nonseq'" :class="item.nonce === '-1' ? 'invisible' : ''">
        {{ item.nonce }}
      </span>
      <span class="flex items-center gap-2.5 whitespace-nowrap w-[120px]">
        <ActionLogo class="shrink-0" :action="actionType" />
        <span>{{ formattedActionType }}</span>
        <SvgoInfo2 v-if="actionType === 'rejection'" v-tippy="'Executing this will cancel transaction(s)'" class="text-slate-500" />
      </span>
      <span class="flex-1 flex-col flex gap-2">
        <ActionMetadata v-for="metadata in decodeMetadata(item.data.params.metadata)" v-once :key="metadata" class="text-left" compact :chain_id="item.chain_id" :metadata="metadata" />
      </span>
      <span class="whitespace-nowrap">
        {{ formatTimeAgo(new Date(activeTab === 'completed' ? item.executed_at : item.created_at)) }}
      </span>
      <span class="flex items-center gap-2.5  whitespace-nowrap">
        <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-slate-400'" />
        <span :class="isConfirmationsMatch ? 'text-primary' : ''">
          {{ item.confirmations.length }} out of {{ item.confirmations_required }}
        </span>
      </span>
      <div>
        <div :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
          <span v-if="isTransactionFailed" class="flex items-center text-red-alert gap-2">
            Failed
            <SvgoErrorCircle class="text-white w-4.5 h-4.5" />
          </span>
          <span v-else-if="isTransactionExecuted" class="flex items-center gap-2">
            Executed
            <SvgoCheckCircle class="success-circle w-5 h-5" />
          </span>
          <span v-else-if="isConfirmationsMatch" class="items-center flex gap-5 justify-between">
            Ready to execute
            <SvgoCheckCircle class="success-circle w-5 h-5" />
          </span>
          <span v-else class="items-center flex gap-5 justify-between whitespace-nowrap">
            <span v-if="isYourSignNeeded">
              Your sign needed
            </span>
            <span v-else>
              Awaiting signatures
            </span>
            <span class="w-5 h-5 flex items-center justify-center">
              <SvgoHourGlass class="w-4 h-4" />
            </span>
          </span>
        </div>
      </div>
    </button>
  </li>
</template>
