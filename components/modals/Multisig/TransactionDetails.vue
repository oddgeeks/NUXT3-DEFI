<script setup lang="ts">
import { wait } from '@instadapp/utils'
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

const { signMultisigData, multisigBroadcast, rejectMultisigTransaction, getCurrentNonce, getActualId, checkTransactionExecuted } = useAvocadoSafe()
const { getRequiredSigner, isAccountCanSign } = useMultisig()
const { requiredSigners } = storeToRefs(useMultisig())
const { selectedSafe } = storeToRefs(useSafe())
const { getContactNameByAddress } = useContacts()
const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()
const currentNonce = ref<number>()
const [signAndExecute, toggle] = useToggle(false)

const router = useRouter()

const pending = ref({
  reject: false,
  execute: false,
  sign: false,
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
const isGeneralLoading = computed(() => !selectedSafe.value || !requiredSigners.value?.length || isUndefined(currentNonce.value))

const isSafeDoesntMatch = computed(() => {
  if (!selectedSafe.value?.safe_address)
    return

  if (!requiredSigners.value)
    return

  return getAddress(transactionRef.value.safe_address) !== getAddress(selectedSafe.value?.safe_address!)
})
const proposalOwnerAddress = computed(() => transactionRef.value.confirmations.length ? transactionRef.value.confirmations[0].address : null)

const { data: isSameNonceExist } = useAsyncData(`${transactionRef.value.id}-same-nonce`, async () => {
  const params = isNonseq.value
    ? {
        rejection_id: transactionRef.value.id,
        status: 'pending',
      }
    : {
        nonce: transactionRef.value.nonce,
        status: 'pending',
      }

  const { data } = await axios.get<IMultisigTransactionResponse>(`/safes/${transactionRef.value.safe_address}/transactions`, {
    params,
    baseURL: multisigURL,
  })

  return isNonseq.value ? data.meta.total > 0 : data.meta.total > 1
}, {
  immediate: true,
  server: false,
  watch: [transactionRef],
})

const errorMessage = computed(() => {
  let message = null

  if (isSafeDoesntMatch.value)
    message = 'This transaction is not for your safe.'

  if (isUndefined(currentNonce.value))
    return null

  else if (isTransactionExecuted.value)
    message = 'This transaction has already been executed.'

  else if (isSignedAlready.value && !isConfirmationsMatch.value)
    message = 'You have already signed this transaction.'

  else
    message = null

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

const { data: simulationDetails, error: simulationError } = useAsyncData(
  `${transactionRef.value.id}`,
  () => {
    if (networksSimulationNotSupported.includes(Number(transactionRef.value.chain_id)))
      throw new Error('Simulation not supported on this network.')

    const id = getActualId(transactionRef.value.data.params.actions)

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
        id,
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

    if (data.confirmations.length === requiredSigner.value && signAndExecute.value)
      await handleExecute(data)

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
      message: item.data,
      safe: selectedSafe.value?.safe_address!,
      targetChainId: item.chain_id,
    })

    if (hash) {
      wait(2000)
      emit('destroy')
      showPendingTransactionModal(hash, item.chain_id, 'send')
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
    await rejectMultisigTransaction(transaction)
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

watch(selectedSafe, async () => {
  if (!selectedSafe.value)
    return
  currentNonce.value = await getCurrentNonce(transactionRef.value.chain_id, selectedSafe.value?.owner_address)
}, {
  immediate: true,
})

const transactionURL = computed(() => {
  if (process.server)
    return ''
  return `${window.location.origin}/multisig/${transactionRef.value.safe_address}/pending-transactions/${transactionRef.value.id}`
})

async function handleExecuteConfirmation(transaction: IMultisigTransaction) {
  pending.value.execute = true

  try {
    const isGasTopup = actionType.value === 'gas-topup'
    const { success } = await openExecuteTransactionModal(transaction.chain_id, transaction.data.params.actions, isGasTopup)

    if (success)
      await handleExecute(transaction)
  }
  finally {
    pending.value.execute = false
  }
}

onUnmounted(() => {
  const currentRoute = router.currentRoute.value
  router.push({
    path: `/multisig/${currentRoute.params.safe}/pending-transactions`,
    query: currentRoute.query,
  })
})
</script>

<template>
  <div>
    <div class="flex sm:flex-row flex-col">
      <div class="flex-1 border-r dark:border-slate-800 border-slate-150">
        <div class="flex flex-col sm:max-h-[710px] overflow-auto scroll-style">
          <div class="sm:p-7.5 p-5 border-b dark:border-slate-800 border-slate-150">
            <div class="flex justify-between sm:flex-row flex-col sm:gap-0 gap-5">
              <div class="flex gap-4">
                <div :class="isColorRed ? 'bg-red-alert' : 'bg-primary'" class="w-14 h-14 rounded-full items-center flex justify-center">
                  <ActionLogo class="!text-white !w-7.5 !h-7.5" :action="actionType" />
                </div>
                <div>
                  <h1 class="text-[22px] leading-[30px]">
                    {{ formattedActionType }}
                  </h1>
                  <span class="text-sm font-medium text-slate-400 inline-flex items-center gap-2">On <ChainLogo class="w-4 h-4" :chain="transactionRef.chain_id" /> {{ chainIdToName(transactionRef.chain_id) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2.5 sm:gap-1.5 sm:flex-col sm:justify-normal justify-between">
                <p class="font-medium leading-[30px] whitespace-nowrap">
                  Created {{ formatTimeAgo(new Date(transactionRef.created_at)) }}
                </p>
                <time class="text-xs text-slate-400 sm:text-right leading-5 whitespace-nowrap" :datetime="transactionRef.created_at">
                  {{ formatted }}
                </time>
              </div>
            </div>
          </div>
          <div v-if="decodedMetadata" class="sm:p-7.5 p-5 border-b flex gap-2.5 dark:border-slate-800 border-slate-150">
            <div class="max-w-2xl scroll-style overflow-auto flex gap-2.5">
              <span v-if="isRejection" class="text-xs inline-flex whitespace-nowrap">
                Executing this transaction will reject transaction
              </span>
              <div v-once class="flex flex-1 flex-col gap-2">
                <ActionMetadata v-for="metadata in decodedMetadata" :key="metadata" compact class="text-xs whitespace-nowrap" :chain_id="transactionRef.chain_id" :metadata="metadata" />
              </div>
            </div>
          </div>
          <div class="sm:p-7.5 p-5 flex-col gap-5 flex border-b dark:border-slate-800 border-slate-150">
            <div v-if="proposalOwnerAddress" class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
              <span class="text-slate-400 text-xs">Creator</span>
              <span>
                <NuxtLink target="_blank" :to="getExplorerUrl(transactionRef.chain_id, `/address/${proposalOwnerAddress}`)" class="text-sm text-primary">
                  {{ shortenHash(proposalOwnerAddress) }}
                </NuxtLink>
                <span v-if="getContactNameByAddress(proposalOwnerAddress)">
                  ({{ getContactNameByAddress(proposalOwnerAddress) }})
                </span>
              </span>
            </div>
            <div v-if="transactionRef.transaction_hash" class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
              <span class="text-slate-400 text-xs">Transaction Hash</span>
              <NuxtLink target="_blank" :to="`${avoExplorerURL}/tx/${transactionRef.transaction_hash}`" class="text-sm text-primary">
                {{ shortenHash(transactionRef.transaction_hash) }}
              </NuxtLink>
            </div>
            <div v-if="transactionRef.note" class="flex flex-col justify-between text-sm gap-2.5">
              <span class="text-slate-400 text-xs">Note</span>
              <span class="text-xs whitespace-break-spaces max-h-[250px] overflow-auto scroll-style">
                {{ transactionRef.note }}
              </span>
            </div>
            <div class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
              <span class="text-slate-400 text-xs">Avocado Multisig Hash</span>
              <span class="text-sm flex items-center gap-2 font-medium">
                {{ shortenHash(transactionRef.id) }}
                <Copy icon-only :text="transactionRef.id" />

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
            <span class="sm:px-7.5 px-5 text-sm mb-5">
              Actions ({{ transactionRef.data.params.actions.length }})
            </span>
            <template v-for="action in transactionRef.data.params.actions" :key="action.data">
              <details class="group px-5 sm:px-7.5">
                <summary class="text-xs flex items-center justify-between cursor-pointer">
                  <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center w-full">
                    <dt class="text-slate-400">
                      Target
                    </dt>
                    <dd class="flex justify-between items-center gap-2 break-all sm:w-[420px]">
                      {{ action.target }}
                      <SvgoChevronDown
                        class="w-5 text-slate-400 group-open:rotate-180"
                      />
                    </dd>
                  </dl>
                </summary>
                <div class="flex flex-col gap-2.5 mt-5">
                  <div v-if="String(action.operation) === '1'" class="flex px-4 py-2 mb-2.5 gap-2.5 justify-between text-sm border w-fit dark:border-slate-700 rounded-[14px]">
                    <SvgoInfo2 class="text-slate-500" />
                    This is a delegate call transaction
                  </div>
                  <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
                    <dt class="text-slate-400">
                      Data
                    </dt>
                    <dd class="flex items-center gap-2 break-all sm:w-[420px]">
                      {{ action.data }}
                    </dd>
                  </dl>
                  <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
                    <dt class="text-slate-400">
                      Operation
                    </dt>
                    <dd class="flex items-center gap-2 break-all sm:w-[420px]">
                      {{ action.operation }}
                    </dd>
                  </dl>
                  <dl class="flex sm:flex-row flex-col justify-between text-sm sm:gap-0 gap-2.5 sm:items-center">
                    <dt class="text-slate-400">
                      Value
                    </dt>
                    <dd class="flex items-center gap-2 break-all sm:w-[420px]">
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
        <div class="sm:p-7.5 p-5 flex">
          <div class="flex sm:gap-1.5 flex-col gap-2">
            <span class="leading-[30px]">
              Signers
            </span>
            <span :class="isConfirmationsMatch ? 'text-primary' : 'text-slate-400'" class="flex items-center gap-2.5 text-xs">
              <SvgoUserCircle />
              <span class="font-medium leading-5">
                {{ transactionRef.confirmations.length }} signed out of {{ actualRequiredSigner }} required
              </span>
            </span>
          </div>
        </div>
        <div class="sm:pb-7.5 pb-5 sm:px-7.5 px-5 border-b dark:border-slate-800 border-slate-150">
          <ul class="flex gap-5 flex-col max-h-[300px] overflow-auto scroll-style">
            <li v-for="signer in transactionRef.confirmations" :key="signer.address">
              <div class="flex gap-3 items-center">
                <AuthorityAvatar class="w-9 h-9 shrink-0" :address="signer.address" />
                <p class="flex flex-col gap-0.5">
                  <span v-if="getContactNameByAddress(signer.address)" class="text-xs whitespace-nowrap truncate max-w-[150px]">
                    {{ getContactNameByAddress(signer.address) }}
                  </span>
                  <span :class="getContactNameByAddress(signer.address) ? 'text-slate-400' : ''" class="text-xs leading-5 font-medium">
                    {{ shortenHash(signer.address) }}
                  </span>
                </p>
                <div class="flex items-center gap-2.5 ml-auto">
                  <div class="flex items-center w-7.5 h-7.5 dark:bg-slate-800 bg-slate-100 rounded-full justify-center">
                    <Copy class="w-3 h-3" icon-only :text="signer.address" />
                  </div>
                  <NuxtLink external target="_blank" :to="getExplorerUrl(transactionRef.chain_id, `/address/${signer.address}`)" class="flex items-center w-7.5 h-7.5 dark:bg-slate-800 bg-slate-100 rounded-full justify-center">
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
        <div v-if="account" class="sm:p-7.5 p-5 flex flex-col gap-5">
          <details v-if="!isTransactionExecuted" class="group">
            <summary class="text-primary text-xs leading-5 cursor-pointer flex items-center justify-between">
              <span class="group-open:hidden block">View transaction breakdown</span>
              <span class="group-open:block hidden">Hide transaction breakdown</span>
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
              <p v-if="simulationError" class="text-xs leading-5 text-orange-400 flex items-center gap-2">
                <SvgoExclamationCircle class="w-3" />

                {{ simulationError.message }}
              </p>
            </div>
          </details>

          <button
            v-if="!isSignedAlready && isConfirmationWillMatch && !isNonceNotMatch"
            :class="{
              'dark:text-white text-slate-900': signAndExecute,
            }"
            class="text-xs text-left font-medium items-base text-slate-400 flex gap-2.5"
            @click="toggle()"
          >
            <SvgoCheckCircle
              :class="[
                { 'success-circle text-white': signAndExecute },
                { 'svg-circle darker': !signAndExecute },
              ]"
              class="w-4 h-4 shrink-0"
            />
            I want to sign & execute in the same txn
          </button>

          <fieldset :disabled="isTransactionExecuted || isSafeDoesntMatch || !canSign || isGeneralLoading" class="grid grid-cols-2 gap-2.5 items-center">
            <Tippy v-if="!isRejection" :content="isSameNonceExist ? 'A rejection proposal for this txn already exists' : undefined" tag="div">
              <CommonButton color="red" :disabled="isRejection || !!isSameNonceExist" :loading="pending.reject" size="lg" class="justify-center w-full" @click="handleReject(transactionRef)">
                Reject
              </CommonButton>
            </Tippy>
            <div
              v-if="isConfirmationsMatch && isSignedAlready" v-tippy="{
                content: isNonceNotMatch ? `Please execute transaction #${currentNonce} first.` : errorMessage,
              }"
            >
              <CommonButton
                :color="isColorRed ? 'red' : 'primary'"
                :disabled="!!errorMessage || pending.execute || isNonceNotMatch" :loading="pending.execute || (isGeneralLoading && !isSafeDoesntMatch)" size="lg" class="w-full justify-center" error-message @click="handleExecuteConfirmation(transactionRef)"
              >
                Execute
              </CommonButton>
            </div>
            <div v-else v-tippy="errorMessage">
              <CommonButton :disabled="!!errorMessage || pending.sign" :loading="pending.sign || (isGeneralLoading && !isSafeDoesntMatch)" size="lg" class="w-full justify-center !leading-5" :class="signAndExecute ? '!px-2 text-xs' : ''" @click="handleSign(transactionRef)">
                {{ signAndExecute ? 'Sign & Execute' : isSignedAlready ? 'Signed' : 'Sign' }}
              </CommonButton>
            </div>
          </fieldset>
          <div v-if="isTransactionExecuted" class="text-xs leading-5 flex gap-2 text-primary font-medium">
            <SvgoInfo2 class="w-5 h-5 text-primary" />
            Transaction has been executed
          </div>

          <p v-else-if="!isGeneralLoading && isSafeDoesntMatch" class="text-xs leading-5 mt-4 text-orange-400 flex gap-2">
            <SvgoExclamationCircle class="w-3 shrink-0 mt-1" />

            You don't have authority to execute this transaction.
          </p>
          <p v-else-if="!isGeneralLoading && !canSign" class="text-xs leading-5 mt-4 text-orange-400 flex gap-2">
            <SvgoExclamationCircle class="w-3 shrink-0 mt-1" />
            You are not a signer on {{ chainIdToName(transactionRef.chain_id) }} network
          </p>
        </div>
        <div v-else class="sm:p-7.5 p-5 flex flex-col gap-5">
          <span class="text-xs leading-5 text-slate-400">Connect your wallet to sign and execute this transaction.</span>
          <Web3Button button-class="!justify-center items-center text-center" />
        </div>
      </div>
    </div>
  </div>
</template>
