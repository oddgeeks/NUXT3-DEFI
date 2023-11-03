<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { getAddress } from 'ethers/lib/utils'
import { Tippy } from 'vue-tippy'
import { AvoMultisigImplementation__factory } from '@/contracts'

const props = defineProps<{
  item: IMultisigTransaction
  activeTab: string | undefined
  insideGroup?: boolean
  networkCellVisible?: boolean
}>()

const route = useRoute()
const { account } = useWeb3()
const { selectedSafe, safeOptions } = storeToRefs(useSafe())
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

const canSign = computed(() => isAccountCanSign(props.item.chain_id, account.value, selectedSafe.value?.owner_address))

const isNonseq = computed(() => props.item.nonce == '-1')
const isNonceNotMatch = computed(() => {
  if (isNonseq.value)
    return false

  if (isSafeDoesntMatch.value)
    return false

  const nonce = safeOptions.value.find(i => i.chainId == props.item.chain_id)?.nonce

  return props.item.nonce !== String(nonce)
})

const isConfirmationsMatch = computed(() => gte(props.item.confirmations.length, props.item.confirmations_required))
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
  <li :class="insideGroup ? 'last:!border-b-0' : ''" class="w-full border-slate-150 dark:border-gray-800 sm:border-b">
    <button class="w-full" @click.stop="handleClick(item)">
      <div :class="networkCellVisible ? 'grid-network-item' : 'grid-item'" class="grid-row hidden w-full items-center px-5 py-4 text-xs font-medium focus:outline-none sm:grid">
        <div v-if="networkCellVisible" class="flex items-center gap-3">
          <Tippy :content="chainIdToName(item.chain_id)">
            <ChainLogo class="h-5 w-5" :chain="item.chain_id" />
          </Tippy>
          <span class="sm:hidden 2xl:inline-block">
            {{ chainIdToName(item.chain_id) }}
          </span>
        </div>
        <span class="flex items-center gap-2.5 whitespace-nowrap">
          <ActionLogo class="shrink-0" :action="actionType" />
          <span>
            {{ formattedActionType }}
            <span v-if="activeTab !== 'nonseq'" v-tippy="`Nonce #${item.nonce}`" :class="item.nonce === '-1' ? 'hidden' : ''">
              ({{ item.nonce }})
            </span>
          </span>
          <SvgoInfo2
            v-if="actionType === 'rejection'" v-tippy="{
              content: 'Executing this will cancel the transaction(s) below',
              maxWidth: 'none',
            }" class="shrink-0 text-gray-500"
          />
        </span>
        <ul :class="(decodedMetadata || [])?.length > 1 ? 'list-decimal pl-5 text-xs' : ''" class="svg-shrink-none flex max-w-sm flex-1 flex-col gap-2 truncate">
          <li v-for="(metadata, index) in decodeMetadata(item.data.params.metadata)" :key="index" v-memo="[tokens]">
            <ActionMetadata :key="metadata" :tokens="transformedTokens as any" class="whitespace-nowrap text-left" compact :chain_id="item.chain_id" :metadata="metadata" />
          </li>
        </ul>
        <span class="whitespace-nowrap text-left">
          {{ formatTimeAgo(new Date(activeTab === 'completed' ? item.executed_at : item.created_at)) }}
        </span>
        <span class="flex items-center gap-2.5  whitespace-nowrap">
          <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-gray-400'" />
          <span :class="isConfirmationsMatch ? 'text-primary' : ''">
            {{ item.confirmations.length }} out of {{ item.confirmations_required }}
          </span>
        </span>

        <div>
          <div :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
            <span v-if="executing && !isTransactionExecuted" class="flex items-center justify-between gap-2">
              Executing
              <SvgSpinner class="h-5 w-5" />
            </span>
            <span v-else-if="isTransactionFailed" class="flex items-center justify-end gap-2 text-red-alert">
              Failed
              <SvgoErrorCircle class="h-4.5 w-4.5 text-white" />
            </span>
            <span v-else-if="isTransactionExecuted" class="flex items-center justify-end gap-2">
              Executed
              <SvgoCheckCircle class="success-circle h-5 w-5" />
            </span>
            <span v-else-if="isConfirmationsMatch" class="flex items-center justify-between gap-5">
              <span v-if="isNonceNotMatch" class="text-gray-400">
                Threshold reached
              </span>
              <span v-else>
                Ready to execute
              </span>
              <SvgoCheckCircle :class="isNonceNotMatch ? 'svg-circle text-[initial]' : 'success-circle'" class="h-5 w-5" />
            </span>
            <span v-else class="flex items-center justify-between gap-5 whitespace-nowrap">
              <span v-if="isYourSignNeeded">
                Your sign needed
              </span>
              <span v-else>
                Awaiting signatures
              </span>
              <span class="flex h-5 w-5 items-center justify-center">
                <SvgoHourGlass class="h-4 w-4" />
              </span>
            </span>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-baseline rounded-5 bg-slate-50 ring-1 ring-slate-150 dark:bg-gray-850 dark:ring-gray-800 sm:hidden">
        <div v-if="networkCellVisible" class="flex items-center gap-3 p-4 text-xs">
          <ChainLogo class="h-4 w-4" :chain="item.chain_id" />
          {{ chainIdToName(item.chain_id) }}
        </div>
        <hr v-if="networkCellVisible" class="w-full border-slate-150 dark:border-gray-800">
        <div class="flex items-center gap-5 px-4 pb-3 pt-4">
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
                }" class="shrink-0 text-gray-500"
            />
          </span>
        </div>
        <hr class="w-full border-slate-150 dark:border-gray-800">
        <div class="px-4 py-3">
          <ul :class="`${(decodedMetadata || [])?.length > 1 ? 'list-decimal pl-5 text-xs' : ''}`" class="svg-shrink-none flex max-w-sm flex-1 flex-col gap-2 truncate text-xs">
            <li v-for="(metadata, index) in decodeMetadata(item.data.params.metadata)" :key="index" v-memo="[tokens]">
              <ActionMetadata :key="metadata" :tokens="transformedTokens as any" class="whitespace-nowrap text-left" compact :chain_id="item.chain_id" :metadata="metadata" />
            </li>
          </ul>
        </div>
        <hr class="w-full border-slate-150 dark:border-gray-800">
        <div class="flex items-center gap-2.5 whitespace-nowrap px-4 py-3 text-xs">
          <SvgoUserCircle :class="isConfirmationsMatch ? 'text-primary' : 'text-gray-400'" />
          <span :class="isConfirmationsMatch ? 'text-primary' : ''">
            {{ item.confirmations.length }} out of {{ item.confirmations_required }}
          </span>
        </div>
        <hr class="w-full border-slate-150 dark:border-gray-800">
        <div class="flex w-full items-center justify-between px-4 pb-3 pt-4 text-xs">
          <div class="font-medium" :class="isConfirmationsMatch ? 'text-primary' : 'text-orange-400'">
            <span v-if="executing && !isTransactionExecuted" class="flex items-center gap-2">
              Executing
              <SvgSpinner class="h-5 w-5" />
            </span>
            <span v-else-if="isTransactionFailed" class="flex items-center justify-end gap-2 text-red-alert">
              Failed
              <SvgoErrorCircle class="h-4.5 w-4.5 text-white" />
            </span>
            <span v-else-if="isTransactionExecuted" class="flex items-center gap-2">
              Executed
              <SvgoCheckCircle class="success-circle h-5 w-5" />
            </span>
            <span v-else-if="isConfirmationsMatch" class="flex items-center justify-between gap-5">
              Ready to execute
              <SvgoCheckCircle class="success-circle h-5 w-5" />
            </span>
            <span v-else class="flex items-center justify-between gap-3 whitespace-nowrap">
              <span v-if="isYourSignNeeded">
                Your sign needed
              </span>
              <span v-else>
                Awaiting signatures
              </span>
              <span class="flex h-5 w-5 items-center justify-center">
                <SvgoHourGlass class="h-4 w-4" />
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
  @apply sm:gap-4 2xl:gap-8 grid-cols-[145px_1fr_95px_120px_200px];
}

.grid-network-item {
  @apply sm:gap-4 2xl:gap-8 sm:grid-cols-[20px_145px_1fr_95px_120px_200px] 2xl:grid-cols-[100px_145px_1fr_95px_120px_200px];
}
</style>

<style>
.svg-shrink-none svg {
  flex-shrink: 0 !important;
}
</style>
