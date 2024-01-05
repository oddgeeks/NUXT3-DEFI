<script setup lang="ts">
import { formatTimeAgo } from '@vueuse/core'
import { isUndefined } from '@walletconnect/utils'
import axios from 'axios'
import { getAddress } from 'ethers/lib/utils'
import { storeToRefs } from 'pinia'
import { Tippy } from 'vue-tippy'

const props = defineProps<{
  transaction: IMultisigTransaction
}>()

const emit = defineEmits(['destroy'])

const transactionRef = ref(props.transaction)

const { signMultisigData, multisigBroadcast, rejectMultisigTransaction, checkTransactionExecuted } = useAvocadoSafe()
const { getRequiredSigner, isAccountCanSign } = useMultisig()
const { selectedSafe, safeOptions } = storeToRefs(useSafe())
const { avoExplorerURL, multisigURL } = storeToRefs(useEnvironmentState())
const { getContactNameByAddress } = useContacts()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()
const [signAndExecute, toggle] = useToggle(false)

const currentNonce = computed(() => safeOptions.value?.find(i => i.chainId == props.transaction.chain_id)?.nonce)

const router = useRouter()

const pending = ref({
  reject: false,
  execute: false,
  sign: false,
})

const executing = useCookie(`executing-${props.transaction.id}`, {
  default() {
    return false
  },
})

const { data: requiredSigner } = useAsyncData<number>(`multisig-required-signer-${transactionRef.value.safe_address}-${transactionRef.value.chain_id}`, async () => {
  try {
    return getRequiredSigner(transactionRef.value.safe_address, transactionRef.value.chain_id)
  }
  catch {
    return 1
  }
}, {
  immediate: true,
})

const actualRequiredSigner = computed(() => isTransactionExecuted.value ? transactionRef.value.confirmations_required : requiredSigner.value || 1)

const formatted = useDateFormat(transactionRef.value.created_at, 'MM.DD.YYYY, HH:mm:ss')
const isConfirmationsMatch = computed(() => gte(transactionRef.value.confirmations.length, actualRequiredSigner.value))
const confirmationNeeded = computed(() => actualRequiredSigner.value - transactionRef.value.confirmations.length)

const isConfirmationWillMatch = computed(() => gte(transactionRef.value.confirmations.length + 1, actualRequiredSigner.value))

const isSignAndExecuteToggleVisible = computed(() => !isSignedAlready.value && isConfirmationWillMatch.value && !isNonceNotMatch.value && !isTransactionExecuted.value)

const isNonseq = computed(() => transactionRef.value.nonce == '-1')
const isNonceNotMatch = computed(() => {
  if (isUndefined(currentNonce.value))
    return false
  return isNonseq.value ? false : transactionRef.value.nonce !== String(currentNonce.value)
})
const isTransactionExecuted = computed(() => checkTransactionExecuted(transactionRef.value))
const isSignedAlready = computed(() => account.value ? transactionRef.value.confirmations.some(item => getAddress(item.address) === getAddress(account.value)) : false)

const canSign = computed(() => isAccountCanSign(transactionRef.value.chain_id, account.value, selectedSafe.value?.owner_address))
const decodedMetadata = computed(() => decodeMetadata(transactionRef.value.data.params.metadata))
const isGeneralLoading = computed(() => !selectedSafe.value || !safeOptions.value?.length || isUndefined(currentNonce.value))

const isFieldsetDisabled = computed(() => isTransactionExecuted.value || isSafeDoesntMatch.value || !canSign.value || isGeneralLoading.value || executing.value)

const isSafeDoesntMatch = computed(() => {
  if (!selectedSafe.value?.safe_address)
    return

  if (!safeOptions.value)
    return

  return getAddress(transactionRef.value.safe_address) !== getAddress(selectedSafe.value?.safe_address!)
})
const proposalOwnerAddress = computed(() => transactionRef.value.confirmations.length ? transactionRef.value.confirmations[0].address : null)

const sameNonceExistMessage = computed(() => {
  if (isGeneralLoading.value)
    return undefined
  return isSameNonceExist.value ? 'A rejection proposal for this txn already exists' : undefined
})

const nonceNotMatchMessage = computed(() => {
  if (isGeneralLoading.value)
    return undefined
  return isNonceNotMatch.value && !isTransactionExecuted.value ? `Please execute transaction #${currentNonce.value} first.` : errorMessage.value
})

const { data: isSameNonceExist } = useAsyncData(`${transactionRef.value.id}-same-nonce`, async () => {
  const params = isNonseq.value
    ? {
        rejection_id: transactionRef.value.id,
        status: 'pending',
        chain_id: transactionRef.value.chain_id,
      }
    : {
        nonce: transactionRef.value.nonce,
        status: 'pending',
        chain_id: transactionRef.value.chain_id,
      }

  const { data } = await axios.get<IMultisigTransactionResponse>(`/safes/${transactionRef.value.safe_address}/transactions`, {
    params,
    baseURL: multisigURL.value,
  })

  return isNonseq.value ? data.meta.total > 0 : data.meta.total > 1
}, {
  immediate: true,
  server: false,
  watch: [transactionRef],
})

const errorMessage = computed(() => {
  let message

  if (isSafeDoesntMatch.value)
    message = 'This transaction is not for your safe.'

  if (executing.value)
    message = 'This transaction is being executed.'

  if (isUndefined(currentNonce.value))
    return undefined

  else if (isTransactionExecuted.value)
    message = 'This transaction has already been executed.'

  else if (isSignedAlready.value && !isConfirmationsMatch.value)
    message = 'You have already signed this transaction.'

  else
    message = undefined

  return message
})

const firstActionMetadata = computed<any>(() => {
  const data = decodeMetadata(transactionRef.value.data.params.metadata) as string[]

  return data?.length ? data[0] : ''
})

const actionType = computed(() => firstActionMetadata.value?.type || '')
const formattedActionType = computed(() => formatTxType(actionType.value || ''))

const isColorRed = computed(() => {
  return isRejection.value
})

const isRejection = computed(() => actionType.value === 'rejection')

useIntervalFn(fetchTransactionDetails, 10000)

const { data: simulationDetails, error: simulationError } = useAsyncData(
  `${transactionRef.value.id}`,
  () => {
    if (networksSimulationNotSupported.includes(Number(transactionRef.value.chain_id)))
      throw new Error('Simulation not supported on this network.')

    return http('/api/simulate', {
      method: 'POST',
      body: {
        actions: transactionRef.value.data.params.actions.map((i: any) => {
          return {
            target: i?.target || i.to,
            data: i.data,
            value: i?.value || '0',
            operation: i?.operation ? String(i?.operation) : '0',
          }
        }),
        avocadoSafe: transactionRef.value.safe_address,
        chainId: transactionRef.value.chain_id,
        id: transactionRef.value.data.params.id,
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
    const { signature } = await signMultisigData({ chainId: item.chain_id, data: item.data })

    const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions/${item.id}/confirmations`, {
      address: account.value,
      signature,
    }, {
      baseURL: multisigURL.value,
    })

    if (isConfirmationWillMatch.value && signAndExecute.value)
      await handleExecuteConfirmation(data)

    else

      transactionRef.value = data
  }
  finally {
    pending.value.sign = false
  }
}

async function handleExecute(item: IMultisigTransaction) {
  try {
    pending.value.execute = true
    const hash = await multisigBroadcast({
      proposalId: item.id,
      owner: selectedSafe.value?.owner_address!,
      confirmations: item.confirmations,
      signers: item.signers,
      message: item.data,
      safe: selectedSafe.value?.safe_address!,
      targetChainId: item.chain_id,
    })

    if (hash) {
      emit('destroy')
      showPendingTransactionModal({
        hash,
        chainId: item.chain_id,
        type: 'transfer',
      })
    }
  }
  catch (e: any) {
    const message = parseTransactionError(e)
    openDialogModal({
      title: 'Error',
      content: message.formatted || 'Something went wrong. Please try again later.',
      type: 'error',
    })
    console.error(e)
  }
  finally {
    pending.value.execute = false
  }
}

async function handleReject(transaction: IMultisigTransaction) {
  try {
    pending.value.reject = true
    const txHash = await rejectMultisigTransaction(transaction)

    if (txHash) {
      emit('destroy')
      showPendingTransactionModal({
        hash: txHash,
        chainId: transaction.chain_id,
        type: 'transfer',
      })
    }
  }
  catch (e: any) {
    const message = parseTransactionError(e)
    openDialogModal({
      title: 'Error',
      content: message.formatted || 'Something went wrong. Please try again later.',
      type: 'error',
    })
    console.error(e)
  }
  finally {
    pending.value.reject = false
  }
}

const transactionURL = computed(() => {
  if (process.server)
    return ''
  return `${window.location.origin}/multisig/${transactionRef.value.safe_address}/pending-transactions/${transactionRef.value.id}`
})

async function handleExecuteConfirmation(transaction: IMultisigTransaction) {
  pending.value.execute = true

  try {
    const isGasTopup = actionType.value === 'gas-topup'

    const { success, payload } = await openExecuteTransactionModal({
      transaction,
      isGasTopup,
    })

    if (!success && payload?.rejection) {
      handleReject(transaction)
      return
    }

    if (success)
      await handleExecute(transaction)
  }
  finally {
    pending.value.execute = false
  }
}

async function fetchTransactionDetails() {
  if (isTransactionExecuted.value)
    return

  const { data } = await axios.get(`/safes/${transactionRef.value.safe_address}/transactions/${transactionRef.value.id}`, {
    baseURL: multisigURL.value,
  })

  transactionRef.value = data
}

onUnmounted(() => {
  const currentRoute = router.currentRoute.value

  if (!currentRoute?.params?.safe)
    return

  router.push({
    name: 'multisig-safe-pending-transactions',
    query: currentRoute.query,
    params: {
      safe: currentRoute?.params?.safe,
    },
  })
})
</script>

<template>
  <div>
    <div class="flex flex-col font-medium sm:flex-row">
      <div class="flex-1 border-r border-gray-800">
        <div class="scroll-style flex flex-col overflow-auto sm:max-h-[710px]">
          <div class="border-b border-gray-800 p-5 sm:p-7.5">
            <div class="flex flex-col justify-between gap-5 sm:flex-row sm:gap-0">
              <div class="flex gap-4">
                <div :class="isColorRed ? 'bg-red-alert' : 'bg-primary'" class="flex h-14 w-14 items-center justify-center rounded-full">
                  <ActionLogo class="!h-7.5 !w-7.5 !text-white" :action="actionType" />
                </div>
                <div>
                  <h1 class="text-[22px] leading-[30px]">
                    {{ formattedActionType }}
                  </h1>
                  <span class="inline-flex items-center gap-2 text-sm font-medium text-gray-400">On <ChainLogo class="h-4 w-4" :chain="transactionRef.chain_id" /> {{ chainIdToName(transactionRef.chain_id) }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between gap-2.5 sm:flex-col sm:justify-normal sm:gap-1.5">
                <p class="whitespace-nowrap font-medium leading-[30px]">
                  Created {{ formatTimeAgo(new Date(transactionRef.created_at)) }}
                </p>
                <time class="whitespace-nowrap text-xs leading-5 text-gray-400 sm:text-right" :datetime="transactionRef.created_at">
                  {{ formatted }}
                </time>
              </div>
            </div>
          </div>
          <div v-if="decodedMetadata" class="flex gap-2.5 border-b border-gray-800 p-5 sm:p-7.5">
            <div class="flex max-w-2xl gap-2.5">
              <span v-if="isRejection" class="inline-flex whitespace-nowrap text-xs">
                Executing this transaction will reject transaction
              </span>
              <div v-once class="flex flex-1 flex-col gap-2">
                <ul :class="`${decodedMetadata.length > 1 ? 'list-decimal pl-5 py-1 text-xs' : ''}`">
                  <li v-for="(metadata, index) in decodedMetadata" :key="index" class="mt-5 first:mt-0">
                    <ActionMetadata class="whitespace-nowrap text-xs" :chain_id="transactionRef.chain_id" :metadata="metadata" />
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-5 border-b border-gray-800 p-5 sm:p-7.5">
            <div v-if="proposalOwnerAddress" class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
              <span class="text-xs text-gray-400">Creator</span>
              <span>
                <NuxtLink target="_blank" :to="getExplorerUrl(transactionRef.chain_id, `/address/${proposalOwnerAddress}`)" class="text-sm text-primary">
                  {{ shortenHash(proposalOwnerAddress) }}
                </NuxtLink>
                <span v-if="getContactNameByAddress(proposalOwnerAddress)">
                  ({{ getContactNameByAddress(proposalOwnerAddress) }})
                </span>
              </span>
            </div>
            <div v-if="transactionRef.transaction_hash" class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
              <span class="text-xs text-gray-400">Transaction Hash</span>
              <NuxtLink target="_blank" :to="`${avoExplorerURL}/tx/${transactionRef.transaction_hash}`" class="text-sm text-primary">
                {{ shortenHash(transactionRef.transaction_hash) }}
              </NuxtLink>
            </div>
            <div v-if="!isNonseq" class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
              <span class="text-xs text-gray-400">Nonce</span>
              <div class="flex items-center gap-2">
                #{{ transactionRef.nonce }}
                <template v-if="!isTransactionExecuted">
                  <div
                    v-if="isGeneralLoading"
                    style="width: 80px; height: 16px"
                    class="loading-box rounded-lg"
                  />
                  <span v-else-if="!isNonceNotMatch" class="text-xs text-gray-400">(next to be executed)</span>
                  <span v-else class="text-xs text-gray-400">(execution unavailable, execute previous txns first)</span>
                </template>
              </div>
            </div>
            <div v-if="transactionRef.note" class="flex flex-col justify-between gap-2.5 text-sm">
              <span class="text-xs text-gray-400">Note</span>
              <span class="scroll-style max-h-[250px] overflow-auto whitespace-break-spaces text-xs">
                {{ transactionRef.note }}
              </span>
            </div>
            <div class="flex flex-col justify-between gap-2.5 text-sm sm:flex-row sm:items-center sm:gap-0">
              <span class="text-xs text-gray-400">Avocado Multisig Hash</span>
              <span class="flex items-center gap-2 text-sm font-medium">
                {{ isNonseq ? 'Non-Sequential' : 'Sequential' }} /
                {{ shortenHash(transactionRef.id) }}
                <Copy icon-only :text="transactionRef.id" />

                <CommonButton class="ml-2 items-center gap-1.5 !p-0 !text-xs" color="white">
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
            <span class="mb-5 px-5 text-sm sm:px-7.5">
              Actions ({{ transactionRef.data.params.actions.length }})
            </span>
            <div class="flex flex-col gap-5">
              <MultisigTransactionActionItem v-for="action, i in transactionRef.data.params.actions" :key="action.data + i" :chain-id="transactionRef.chain_id" :action="action" />
            </div>
          </div>
        </div>
      </div>
      <div class="sm:w-[340px]">
        <div class="flex p-5 sm:p-7.5">
          <div class="flex flex-col gap-2 sm:gap-1.5">
            <span class="leading-[30px]">
              Signers
            </span>
            <span :class="isConfirmationsMatch ? 'text-primary' : 'text-gray-400'" class="flex items-center gap-2.5 text-xs">
              <SvgoUserCircle />
              <span class="font-medium leading-5">
                {{ transactionRef.confirmations.length }} signed out of {{ actualRequiredSigner }} required
              </span>
            </span>
          </div>
        </div>
        <div class="border-b border-gray-800 px-5 pb-5 sm:px-7.5 sm:pb-7.5">
          <ul class="scroll-style flex max-h-[300px] flex-col gap-5 overflow-auto">
            <li v-for="signer in transactionRef.confirmations" :key="signer.address">
              <div class="flex items-center gap-3">
                <AuthorityAvatar class="h-9 w-9 shrink-0" :address="signer.address" />
                <p class="flex flex-col gap-0.5">
                  <span v-if="getContactNameByAddress(signer.address)" class="max-w-[150px] truncate whitespace-nowrap text-xs">
                    {{ getContactNameByAddress(signer.address) }}
                  </span>
                  <button v-else class="text-xs font-medium text-primary" @click="openAddContactModal(undefined, signer.address)">
                    Save as Contact
                  </button>
                  <span :class="getContactNameByAddress(signer.address) ? 'text-gray-400' : ''" class="text-xs font-medium leading-5">
                    {{ shortenHash(signer.address) }}
                  </span>
                </p>
                <div class="ml-auto flex items-center gap-2.5">
                  <div class="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-gray-900">
                    <Copy class="h-3 w-3" icon-only :text="signer.address" />
                  </div>
                  <NuxtLink external target="_blank" :to="getExplorerUrl(transactionRef.chain_id, `/address/${signer.address}`)" class="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-gray-900">
                    <SvgoExternalLink class="h-3 w-3 text-gray-400" />
                  </NuxtLink>
                </div>
              </div>
            </li>
          </ul>
          <div v-if="!isConfirmationsMatch" class="mt-5 flex gap-2 text-xs font-medium leading-5 text-orange-400">
            <SvgoInfo2 class="h-5 w-5 text-orange-400" />
            {{ confirmationNeeded }} more confirmations needed for execution
          </div>
        </div>
        <div v-if="account" class="flex flex-col gap-7.5 p-5 sm:p-7.5">
          <details v-if="!isTransactionExecuted" class="group">
            <summary class="flex cursor-pointer items-center justify-between text-xs leading-5 text-primary">
              <span class="block group-open:hidden">View transaction breakdown</span>
              <span class="hidden group-open:block">Hide transaction breakdown</span>
              <SvgoChevronDown class="group-open:rotate-180" />
            </summary>
            <div class="mt-5">
              <SimulationDetails
                v-if="simulationDetails"
                :chain-id="transactionRef.chain_id"
                :details="simulationDetails"
                :has-error="!!simulationError"
                title-hidden
                wrapper-class="sm:!flex flex-col"
              />
              <p v-if="simulationError" class="flex items-center gap-2 text-xs leading-5 text-orange-400">
                <SvgoExclamationCircle class="w-3" />

                {{ simulationError.message }}
              </p>
            </div>
          </details>

          <button
            v-if="isSignAndExecuteToggleVisible"
            :class="{
              'text-white': signAndExecute,
            }"
            class="items-base flex gap-2.5 text-left text-xs font-medium text-gray-400"
            @click="toggle()"
          >
            <SvgoCheckCircle
              :class="[
                { 'success-circle text-white': signAndExecute },
                { 'svg-circle darker': !signAndExecute },
              ]"
              class="h-4 w-4 shrink-0"
            />
            I want to sign & execute in the same txn
          </button>

          <fieldset :disabled="isFieldsetDisabled" class="grid grid-cols-2 items-center gap-2.5">
            <Tippy v-if="!isRejection" :content="sameNonceExistMessage" tag="div">
              <CommonButton color="red" :disabled="isRejection || !!isSameNonceExist" :loading="pending.reject" size="lg" class="w-full justify-center" @click="handleReject(transactionRef)">
                Reject
              </CommonButton>
            </Tippy>
            <Tippy
              v-if="isConfirmationsMatch && isSignedAlready"
              :content="nonceNotMatchMessage"
            >
              <CommonButton
                :color="isColorRed ? 'red' : 'primary'"
                :disabled="!!errorMessage || pending.execute || isNonceNotMatch" :loading="pending.execute || (isGeneralLoading && !isSafeDoesntMatch)" size="lg" class="w-full justify-center" error-message @click="handleExecuteConfirmation(transactionRef)"
              >
                {{ executing && !isTransactionExecuted ? 'Executing' : 'Execute' }}
              </CommonButton>
            </Tippy>
            <Tippy v-else :content="errorMessage">
              <CommonButton :color="isColorRed ? 'red' : 'primary'" :disabled="!!errorMessage || pending.sign" :loading="pending.sign || (isGeneralLoading && !isSafeDoesntMatch)" size="lg" class="w-full justify-center !leading-5" :class="signAndExecute ? '!px-2 text-xs' : ''" @click="handleSign(transactionRef)">
                {{ signAndExecute ? 'Sign & Execute' : isSignedAlready ? 'Signed' : 'Sign' }}
              </CommonButton>
            </Tippy>
          </fieldset>
          <div v-if="isTransactionExecuted" class="flex gap-2 text-xs font-medium leading-5 text-primary">
            <SvgoInfo2 class="h-5 w-5 text-primary" />
            Transaction has been executed
          </div>

          <p v-else-if="!isGeneralLoading && isSafeDoesntMatch" class="mt-4 flex gap-2 text-xs leading-5 text-orange-400">
            <SvgoExclamationCircle class="mt-1 w-3 shrink-0" />

            You don't have authority to execute this transaction.
          </p>
          <p v-else-if="!isGeneralLoading && !canSign" class="mt-4 flex gap-2 text-xs leading-5 text-orange-400">
            <SvgoExclamationCircle class="mt-1 w-3 shrink-0" />
            You are not a signer on {{ chainIdToName(transactionRef.chain_id) }} network
          </p>
        </div>
        <div v-else class="flex flex-col gap-5 p-5 sm:p-7.5">
          <span class="text-xs leading-5 text-gray-400">Connect your wallet to sign and execute this transaction.</span>
          <Web3Button button-class="!justify-center items-center text-center" />
        </div>
      </div>
    </div>
  </div>
</template>
