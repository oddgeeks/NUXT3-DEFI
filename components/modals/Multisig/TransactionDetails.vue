<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { isUndefined } from '@walletconnect/utils'
import axios from 'axios'
import { getAddress } from 'ethers/lib/utils'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  transaction: IMultisigTransaction
}>()

const emit = defineEmits(['destroy'])

const { signMultisigData, multisigBroadcast, rejectMultisigTransaction, getCurrentNonce } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())
const { account } = useWeb3()
const currentNonce = ref<number>()

const router = useRouter()

const pending = ref({
  reject: false,
  execute: false,
  sign: false,
})

const formatted = useDateFormat(props.transaction.created_at, 'MM.DD.YYYY, HH:mm:ss')
const isConfirmationsMatch = computed(() => props.transaction.confirmations.length === props.transaction.confirmations_required)
const confirmationNeeded = computed(() => props.transaction.confirmations_required - props.transaction.confirmations.length)

const isNonseq = computed(() => props.transaction.nonce == '-1')
const isNonceNotMatch = computed(() => isNonseq.value ? false : props.transaction.nonce !== String(currentNonce.value))
const isTransactionExecuted = computed(() => props.transaction.executed_at !== null)
const isSignedAlready = computed(() => props.transaction.confirmations.some(item => item.address === getAddress(account.value)))

const decodedMetadata = computed(() => decodeMetadata(props.transaction.data.params.metadata))

const isSafeDoesntMatch = computed(() => props.transaction.safe_address !== selectedSafe.value?.safe_address)

const errorMessage = computed(() => {
  let message = null

  if (isSafeDoesntMatch.value)
    message = 'This transaction is not for your safe.'

  if (!currentNonce.value)
    return null
  else if (isTransactionExecuted.value)
    message = 'This transaction has already been executed.'

  else if (isSignedAlready.value)
    message = 'You have already signed this transaction.'

  else if (isNonceNotMatch.value)
    message = `Please execute transaction ${currentNonce.value} first.`

  else
    message = null

  return message
})

const firstActionMetadata = computed<any>(() => {
  const data = decodeMetadata(props.transaction.data.params.metadata) as string[]

  return data?.length ? data[0] : ''
})

const actionType = computed(() => firstActionMetadata.value?.type || '')
const formattedActionType = computed(() => formatTxType(actionType.value || ''))

const { data: simulationDetails, error: simulationError } = useAsyncData(
  `${props.transaction.id}`,
  () => {
    if (networksSimulationNotSupported.includes(Number(props.transaction.chain_id)))
      throw new Error('Simulation not supported on this network.')

    return http('/api/simulate', {
      method: 'POST',
      body: {
        actions: props.transaction.data.params.actions,
        avocadoSafe: props.transaction.safe_address,
        chainId: props.transaction.chain_id,
      },
    }) as Promise<ISimulation>
  },
  {
    immediate: true,
    server: false,
  },
)

async function handleSign(item: IMultisigTransaction) {
  try {
    pending.value.sign = true
    const signature = await signMultisigData({ chainId: item.chain_id, data: item.data })

    const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions/${item.id}/confirmations`, {
      address: account.value,
      signature,
    }, {
      baseURL: multisigURL,
    })

    if (data.confirmations.length === data.confirmations_required)
      handleExecute(data)
  }
  finally {
    pending.value.sign = false
  }
}

async function handleExecute(item: IMultisigTransaction) {
  try {
    pending.value.execute = true
    const hash = await multisigBroadcast({
      owner: selectedSafe.value?.owner_address!,
      confirmations: item.confirmations,
      message: item.data,
      safe: selectedSafe.value?.safe_address!,
      targetChainId: item.chain_id,
    })

    if (hash) {
      emit('destroy')
      showPendingTransactionModal(hash, item.chain_id, 'send')
    }
  }
  finally {
    pending.value.execute = false
  }
}

async function handleReject(transaction: IMultisigTransaction) {
  try {
    pending.value.reject = true
    await rejectMultisigTransaction(transaction)
  }
  finally {
    pending.value.reject = false
  }
}

watch(selectedSafe, async () => {
  if (!selectedSafe.value)
    return
  currentNonce.value = await getCurrentNonce(props.transaction.chain_id)
}, {
  immediate: true,
})

const transactionURL = computed(() => {
  if (process.server)
    return ''
  return `${window.location.origin}/multisig/${props.transaction.safe_address}/pending-transactions/${props.transaction.id}`
})

onUnmounted(() => {
  const currentRoute = router.currentRoute.value
  if (currentRoute.name === 'multisig-safe-pending-transactions-id')
    router.push(`/multisig/${currentRoute.params.safe}/pending-transactions`)
})
</script>

<template>
  <div>
    <div class="flex">
      <div class="flex-1 border-r dark:border-slate-800 border-slate-150">
        <div class="flex flex-col max-h-[710px] overflow-auto scroll-style">
          <div class="p-7.5 border-b dark:border-slate-800 border-slate-150">
            <div class="flex justify-between">
              <div class="flex gap-4">
                <div class="w-14 h-14 rounded-full items-center flex justify-center bg-primary">
                  <ActionLogo class="!text-white !w-7.5 !h-7.5" :action="actionType" />
                </div>
                <div>
                  <h1 class="text-[22px] leading-[30px]">
                    {{ formattedActionType }}
                  </h1>
                  <span class="text-sm font-medium text-slate-400 inline-flex items-center gap-2">On <ChainLogo class="w-4 h-4" :chain="transaction.chain_id" /> {{ chainIdToName(transaction.chain_id) }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <p class="font-medium leading-[30px]">
                  Created {{ formatTimeAgo(new Date(transaction.created_at)) }}
                </p>
                <time class="text-xs text-slate-400 text-right leading-5" :datetime="transaction.created_at">
                  {{ formatted }}
                </time>
              </div>
            </div>
          </div>
          <div v-if="decodedMetadata" class="p-7.5 border-b dark:border-slate-800 border-slate-150">
            <div v-once>
              <ActionMetadata v-for="metadata in decodedMetadata" :key="metadata" compact class="text-xs" :chain_id="transaction.chain_id" :metadata="metadata" />
            </div>
          </div>
          <div class="p-7.5 flex-col gap-4 flex border-b dark:border-slate-800 border-slate-150">
            <div v-if="transaction.note" class="flex justify-between text-sm items-center">
              <span class="text-slate-400 text-xs">Note</span>
              <span class="text-sm">
                {{ transaction.note }}
              </span>
            </div>
            <div class="flex justify-between text-sm items-center">
              <span class="text-slate-400 text-xs">Safe Tx Hash</span>
              <span class="text-sm flex items-center gap-2 font-medium">
                {{ shortenHash(transaction.id) }}
                <Copy icon-only :text="transaction.id" />

                <CommonButton class="!p-0 !text-xs items-center gap-1.5 ml-2" color="white">
                  <Copy success-text="Link Copied" class="!px-4 py-2" :text="transactionURL">
                    <template #content>
                      <span class="text-white">Share</span>
                    </template>
                    <template #copy-icon>
                      <SvgoNode class="text-white" />
                    </template>
                  </Copy>
                </CommonButton>
              </span>
            </div>
          </div>
          <div class="flex flex-col py-5">
            <template v-for="action, i in transaction.data.params.actions" :key="action.data">
              <details open class="group px-7.5">
                <summary class="text-xs flex items-center justify-between cursor-pointer">
                  Action {{ i + 1 }}

                  <SvgoChevronDown
                    class="w-5 text-slate-400 group-open:rotate-180"
                  />
                </summary>
                <div class="flex flex-col gap-2.5 mt-5">
                  <div v-if="action.operation === '1'" class="flex px-4 py-2 mb-2.5 gap-2.5 justify-between text-sm border w-fit dark:border-slate-700 rounded-[14px]">
                    <SvgoInfo2 class="text-slate-500" />
                    This is a delegate call transaction
                  </div>
                  <dl class="flex justify-between text-xs">
                    <dt class="text-slate-400">
                      Target
                    </dt>
                    <dd class="flex items-center gap-2 break-all w-[420px]">
                      {{ action.target }}
                    </dd>
                  </dl>
                  <dl class="flex justify-between text-xs">
                    <dt class="text-slate-400">
                      Data
                    </dt>
                    <dd class="flex items-center gap-2 break-all w-[420px]">
                      {{ action.data }}
                    </dd>
                  </dl>
                  <dl class="flex justify-between text-xs">
                    <dt class="text-slate-400">
                      Operation
                    </dt>
                    <dd class="flex items-center gap-2 break-all w-[420px]">
                      {{ action.operation }}
                    </dd>
                  </dl>
                  <dl class="flex justify-between text-xs">
                    <dt class="text-slate-400">
                      Value
                    </dt>
                    <dd class="flex items-center gap-2 break-all w-[420px]">
                      {{ action.value }}
                    </dd>
                  </dl>
                </div>
              </details>
              <hr class="border-slate-150 my-5 last:hidden dark:border-slate-800">
            </template>
          </div>
        </div>
      </div>
      <div class="sm:w-[340px]">
        <div class="p-7.5">
          <div class="flex flex-col gap-1.5">
            <span class="leading-[30px]">
              Signers
            </span>
            <span :class="transaction.confirmations.length === transaction.confirmations_required ? 'text-primary' : 'text-slate-400'" class="flex items-center gap-2.5 text-xs">
              <SvgoUserCircle />
              <span class="font-medium leading-5">
                {{ transaction.confirmations.length }} out of {{ transaction.confirmations_required }}
              </span>
            </span>
          </div>
        </div>
        <div class="pb-7.5 px-7.5 border-b dark:border-slate-800 border-slate-150">
          <ul class="flex gap-5 flex-col">
            <li v-for="signer in transaction.confirmations" :key="signer.address">
              <div class="flex gap-3 items-center">
                <AuthorityAvatar class="w-9 h-9" :address="signer.address" />
                <span class="text-xs leading-5 font-medium">
                  {{ shortenHash(signer.address) }}
                </span>
                <div class="flex items-center gap-2.5 ml-auto">
                  <div class="flex items-center w-7.5 h-7.5 dark:bg-slate-800 bg-slate-100 rounded-full justify-center">
                    <Copy class="w-3 h-3" icon-only :text="signer.address" />
                  </div>
                  <NuxtLink external target="_blank" :to="getExplorerUrl(transaction.chain_id, `/address/${signer.address}`)" class="flex items-center w-7.5 h-7.5 dark:bg-slate-800 bg-slate-100 rounded-full justify-center">
                    <SvgoExternalLink class="w-3 h-3 text-slate-400" />
                  </NuxtLink>
                </div>
              </div>
            </li>
          </ul>
          <div v-if="!isConfirmationsMatch" class="text-xs leading-5 flex gap-2 mt-5 text-orange-400 font-medium">
            <SvgoInfo2 class="w-5 h-5 text-orange-400" />
            {{ confirmationNeeded }} more confirmations needed for execution
          </div>
        </div>
        <div class="py-7.5 px-7.5">
          <details class="mb-5">
            <summary class="text-primary text-xs leading-5 cursor-pointer">
              View transaction breakdown
            </summary>
            <div class="mt-5">
              <SimulationDetails
                v-if="simulationDetails"
                :chain-id="transaction.chain_id"
                :details="simulationDetails"
                :has-error="!!simulationError"
                title-hidden
                wrapper-class="sm:!flex flex-col"
              />
              <p v-if="simulationError" class="text-xs leading-5 text-orange-400 flex items-center gap-2">
                <SvgoExclamationCircle class="w-3" />

                {{ simulationError.message }}
              </p>
            </div>
          </details>
          <fieldset :disabled="isTransactionExecuted || isSafeDoesntMatch" class="grid grid-cols-2 gap-2.5 items-center">
            <CommonButton :loading="pending.reject" color="red" size="lg" class="justify-center" @click="handleReject(transaction)">
              Reject
            </CommonButton>
            <div v-show="isConfirmationsMatch" v-tippy="errorMessage">
              <CommonButton :disabled="!!errorMessage || pending.execute" :loading="pending.execute || (isUndefined(currentNonce) && !isSafeDoesntMatch)" size="lg" class="w-full justify-center" @click="handleExecute(transaction)">
                Execute
              </CommonButton>
            </div>
            <div v-tippy="errorMessage">
              <CommonButton :disabled="!!errorMessage || pending.sign" :loading="pending.sign || (isUndefined(currentNonce) && !isSafeDoesntMatch)" size="lg" class="w-full justify-center" @click="handleSign(transaction)">
                Sign
              </CommonButton>
            </div>
          </fieldset>
          <div v-if="isTransactionExecuted" class="text-xs leading-5 flex gap-2 mt-5 text-primary font-medium">
            <SvgoInfo2 class="w-5 h-5 text-primary" />
            Transaction has been executed
          </div>

          <p v-else-if="isSafeDoesntMatch" class="text-xs leading-5 mt-4 text-orange-400 flex gap-2">
            <SvgoExclamationCircle class="w-3 shrink-0 mt-1" />

            You don't have authority to execute this transaction.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
