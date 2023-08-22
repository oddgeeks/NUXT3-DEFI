<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { getAddress } from 'ethers/lib/utils'
import { AvoMultisigImplementation__factory } from '@/contracts'

const props = defineProps<{
  item: IMultisigTransaction
  activeTab: string | undefined
  requiredSigner: number | null
  insideGroup: boolean
  currentNonce: number | null
}>()

const route = useRoute()
const { account } = useWeb3()
const { selectedSafe } = storeToRefs(useSafe())
const { checkTransactionExecuted } = useAvocadoSafe()
const { isAccountCanSign } = useMultisig()
const { tokens } = storeToRefs(useTokens())

const executing = useCookie(`executing-${props.item.id}`, {
  default() {
    return false
  },
})

const transformedTokens = computed(() => {
  if (!tokens.value)
    return []

  return tokens.value.map((i) => {
    return {
      ...i,
      chain_id: i.chainId,
      logo_url: i.logoURI,
    }
  })
})

const actualRequiredSigner = computed(() => props.activeTab === 'completed' ? props.item.confirmations_required : props.requiredSigner || 1)

const canSign = computed(() => isAccountCanSign(props.item.chain_id, account.value, selectedSafe.value?.owner_address))

const isNonseq = computed(() => props.item.nonce == '-1')
const isNonceNotMatch = computed(() => isNonseq.value ? false : props.item.nonce !== String(props.currentNonce))

const isConfirmationsMatch = computed(() => gte(props.item.confirmations.length, actualRequiredSigner.value))
const isYourSignNeeded = computed(() => {
  if (isSafeDoesntMatch.value || !account.value || !canSign.value)
    return false

  return !props.item.confirmations.find(item => getAddress(account.value) === getAddress(item.address))
})
const isTransactionExecuted = computed(() => checkTransactionExecuted(props.item))
const isSafeDoesntMatch = computed(() => {
  if (!selectedSafe.value?.safe_address)
    return true

  return getAddress(props.item.safe_address) !== getAddress(selectedSafe.value?.safe_address || '')
})
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

const decodedMetadata = computed(() => decodeMetadata(props.item.data.params.metadata))

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
  <li :class="insideGroup ? 'last:!border-b-0' : ''" class="w-full border-b border-slate-150 dark:border-slate-800">
    <button class="w-full" @click.stop="handleClick(item)">
      <div class="hidden grid-row sm:grid grid-item focus:outline-none items-center w-full text-xs font-medium py-4 px-5">
        <span class="flex items-center gap-2.5 whitespace-nowrap">

          <ActionLogo class="shrink-0" :action="actionType" />
          <span>{{ formattedActionType }}
            <span v-if="activeTab !== 'nonseq'" v-tippy="`Nonce #${item.nonce}`" :class="item.nonce === '-1' ? 'hidden' : ''">
              ({{ item.nonce }})
            </span>
          </span>
          <SvgoInfo2
            v-if="actionType === 'rejection'" v-tippy="{
              content: 'Executing this will cancel the transaction(s) below',
              maxWidth: 'none',
            }" class="text-slate-500 shrink-0"
          />
        </span>
        <ul :class="`${(decodedMetadata || [])?.length > 1 ? 'list-decimal pl-5 text-xs' : ''}`" class="flex-1 flex-col flex gap-2 svg-shrink-none max-w-sm truncate">
          <li v-for="(metadata, index) in decodeMetadata(item.data.params.metadata)" :key="index" v-memo="[tokens]">
            <ActionMetadata :key="metadata" :tokens="transformedTokens as any" class="text-left whitespace-nowrap" compact :chain_id="item.chain_id" :metadata="metadata" />
          </li>
        </ul>
        <span class="whitespace-nowrap text-left">
          {{ formatTimeAgo(new Date(activeTab === 'completed' ? item.executed_at : item.created_at)) }}
        </span>
        <span class="flex items-center gap-2.5  whitespace-nowrap">
          <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-slate-400'" />
          <span :class="isConfirmationsMatch ? 'text-primary' : ''">
            {{ item.confirmations.length }} out of {{ actualRequiredSigner }}
          </span>
        </span>

        <div>
          <div :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
            <span v-if="executing && !isTransactionExecuted" class="items-center flex gap-2 justify-between">
              Executing
              <SvgoClockCircle class="w-5 h-5" />
            </span>
            <span v-else-if="isTransactionFailed" class="flex items-center text-red-alert gap-2 justify-end">
              Failed
              <SvgoErrorCircle class="text-white w-4.5 h-4.5" />
            </span>
            <span v-else-if="isTransactionExecuted" class="flex items-center gap-2 justify-end">
              Executed
              <SvgoCheckCircle class="success-circle w-5 h-5" />
            </span>
            <span v-else-if="isConfirmationsMatch" class="items-center flex gap-5 justify-between">
              <span v-if="isNonceNotMatch" class="text-slate-400">
                Threshold reached
              </span>
              <span v-else>
                Ready to execute
              </span>
              <SvgoCheckCircle :class="isNonceNotMatch ? 'svg-circle text-[initial]' : 'success-circle'" class="w-5 h-5" />
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
      </div>
      <div class="sm:hidden flex flex-col items-baseline dark:bg-gray-850 bg-slate-50 ring-slate-150 dark:ring-slate-800 ring-1 rounded-5">
        <div class="px-4 pt-4 pb-3 flex items-center gap-5">
          <span v-if="activeTab !== 'nonseq'" :class="item.nonce === '-1' ? 'hidden' : ''">
            {{ item.nonce }}
          </span>
          <span class="flex items-center gap-3">
            <ActionLogo class="shrink-0" :action="actionType" />
            <span class="text-xs">{{ formattedActionType }}</span>
            <SvgoInfo2
              v-if="actionType === 'rejection'" v-tippy="
                {
                  content: 'Executing this will cancel the transaction(s) below',
                  maxWidth: 'none',
                }" class="text-slate-500 shrink-0"
            />
          </span>
        </div>
        <hr class="border-slate-150 w-full dark:border-slate-800">
        <div class="py-3 px-4">
          <ul :class="`${(decodedMetadata || [])?.length > 1 ? 'list-decimal pl-5 text-xs' : ''}`" class="flex-1 text-xs flex-col flex gap-2 svg-shrink-none max-w-sm truncate">
            <li v-for="(metadata, index) in decodeMetadata(item.data.params.metadata)" :key="index" v-memo="[tokens]">
              <ActionMetadata :key="metadata" :tokens="transformedTokens as any" class="text-left whitespace-nowrap" compact :chain_id="item.chain_id" :metadata="metadata" />
            </li>
          </ul>
        </div>
        <hr class="border-slate-150 w-full dark:border-slate-800">
        <div class="flex items-center py-3 px-4 gap-2.5 whitespace-nowrap text-xs">
          <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-slate-400'" />
          <span :class="isConfirmationsMatch ? 'text-primary' : ''">
            {{ item.confirmations.length }} out of {{ actualRequiredSigner }}
          </span>
        </div>
        <hr class="border-slate-150 w-full dark:border-slate-800">
        <div class="text-xs px-4 pt-4 pb-3 flex justify-between items-center w-full">
          <div class="font-medium" :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
            <span v-if="executing && !isTransactionExecuted" class="flex items-center gap-2">
              Executing
              <SvgoClockCircle class="w-5 h-5" />
            </span>
            <span v-else-if="isTransactionFailed" class="flex items-center text-red-alert gap-2 justify-end">
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
            <span v-else class="items-center flex gap-3 justify-between whitespace-nowrap">
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
          <time>
            {{ formatTimeAgo(new Date(activeTab === 'completed' ? item.executed_at : item.created_at)) }}
          </time>
        </div>
      </div>
    </button>
  </li>
</template>

<style scoped>
.grid-item {
  grid-template-columns: 145px 1fr 95px 120px 200px;
  @apply gap-8;
}
</style>

<style>
.svg-shrink-none svg {
  flex-shrink: 0 !important;
}
</style>
