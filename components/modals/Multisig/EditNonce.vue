<script setup lang="ts">
import { isUndefined } from '@walletconnect/utils'
import axios from 'axios'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  chainId: number | string
  actions: any[]
  defaultNonce?: number
  estimatedFee?: boolean
  rejection?: boolean
  rejectionId?: string
  transactionType?: MultisigTransactionType
  metadata?: string
  options?: any
}>()

const emit = defineEmits(['resolve', 'destroy'])
const { selectedSafe } = storeToRefs(useSafe())
const { getActualId, safeAddress, generateMultisigSignatureAndSign, multisigBroadcast } = useAvocadoSafe()
const { requiredSigners } = storeToRefs(useMultisig())
const { parseTransactionError } = useErrorHandler()
const { clearAllModals } = useModal()

const isDeleteOrAddSigner = props.transactionType === 'remove-signers' || props.transactionType === 'add-signers'
const recommendedNonce = isDeleteOrAddSigner ? -1 : undefined

const isSubmitting = ref(false)
const nonce = ref<number | undefined>(recommendedNonce)
const note = ref<string | undefined>(undefined)
const detailsRef = ref<HTMLDetailsElement>()
const [simulationStatus, toggle] = useToggle()
const [signAndExecute, signAndExecuteToggle] = useToggle(false)

const requiredSignersByChain = computed(() => requiredSigners.value.find(i => i.chainId == props.chainId))
const isSignOnly = computed(() => !signAndExecute.value && !isExecuteReady.value)

const { data: seqResponse } = useAsyncData<IMultisigTransactionResponse>(`${safeAddress.value}-seq-count`, async () => {
  const { data } = await axios.get(`/safes/${safeAddress.value}/transactions`, {
    params: {
      status: 'pending',
      nonce_type: 'seq',
    },
    baseURL: multisigURL,
  })

  return data
}, {
  lazy: true,
  server: false,
})

const isExecutionNotAvailable = computed(() => {
  const actualNonce = props.rejection ? props.defaultNonce : nonce.value

  return actualNonce === -1 ? false : gt(seqResponse.value?.meta?.total || 0, 0)
})

const isExecuteReady = computed(() => {
  if (!requiredSignersByChain.value)
    return false
  return requiredSignersByChain.value?.requiredSignerCount === 1 && !isExecutionNotAvailable.value
})

whenever(isExecuteReady, () => {
  signAndExecuteToggle(true)
}, {
  immediate: true,
})

const { data, error, pending: feePending } = useEstimatedFee(ref(props.actions), ref(props.chainId), {
  immediate: true,
  disabled: () => !props.estimatedFee,
  metadata: props.metadata,
  nonce: nonce.value,
})

const transactionTypes = [
  {
    name: 'Non-Sequential',
    value: -1,
  },
  {
    name: 'Sequential',
    value: undefined,
  },
]

async function onSubmit() {
  let proposalId

  try {
    isSubmitting.value = true
    const payload = {
      nonce: nonce.value,
      note: note.value,
      signOnly: !(signAndExecute.value && isExecuteReady.value),
    }

    const actualNonce = !isUndefined(props.defaultNonce) ? props.defaultNonce : payload?.nonce

    const signOnly = payload.signOnly

    const params = await generateMultisigSignatureAndSign({ chainId: props.chainId, actions: props.actions, nonce: actualNonce, note: payload.note, metadata: props.metadata, options: props.options })

    // generate proposal
    const { data } = await axios.post<IMultisigTransaction>(`/safes/${selectedSafe.value?.safe_address}/transactions`, {
      chain_id: String(props.chainId),
      status: 'pending',
      signer: params?.signatureParams,
      data: params?.castParams,
      note: payload.note,
      nonce,
    }, {
      baseURL: multisigURL,
    })

    proposalId = data.id

    if (data.confirmations_required === 1 && !signOnly) {
      const txHash = await multisigBroadcast({
        proposalId: data.id,
        confirmations: data.confirmations,
        message: data.data,
        owner: selectedSafe.value?.owner_address!,
        safe: selectedSafe.value?.safe_address!,
        targetChainId: props.chainId,
      })

      emit('resolve', true, {
        id: data.id,
        txHash,
      })
    }
    else {
      emit('resolve', true, {
        id: data.id,
      })
    }
  }
  catch (e: any) {
    console.log(e)
    const parsed = parseTransactionError(e)

    if (e.cause?.message === 'sign-execution-data-failed' && proposalId && selectedSafe.value?.safe_address) {
      clearAllModals()
      return openExecutionErrorModal(proposalId, selectedSafe.value?.safe_address)
    }

    openSnackbar({
      message: parsed.formatted,
      type: 'error',
    })
  }
  finally {
    isSubmitting.value = false
  }
}

const { data: simulationDetails, error: simulationError, pending } = useAsyncData(
  () => {
    if (networksSimulationNotSupported.includes(Number(props.chainId)))
      throw new Error('Simulation not supported on this network.')

    const actions = props.actions.map((action) => {
      return {
        operation: action.operation ? String(action.operation) : '0',
        target: action?.target || action.to,
        data: action.data || '0x',
        value: action.value || '0',
      }
    }) as any

    const id = getActualId(actions, props.options?.id)

    return http('/api/simulate', {
      method: 'POST',
      body: {
        actions: actions.map((i: any) => {
          return {
            target: i?.target || i.to,
            data: i.data,
            value: i?.value || '0',
            operation: i?.operation ? String(i?.operation) : '0',
          }
        }),
        avocadoSafe: selectedSafe.value?.safe_address,
        chainId: props.chainId,
        id,
      },
    }) as Promise<ISimulation>
  },
  {
    immediate: true,
    server: false,
  },
)

const isTransactionFailed = computed(() => !simulationDetails.value?.transaction?.status)

function getNonceTooltip(value: number | undefined) {
  let message = ''
  const articleLink = 'https://help.avocado.instadapp.io/en/articles/8117229-sequential-vs-non-sequential-transactions'
  if (value === undefined)
    message = `Sequential transactions need to be executed in the order they were proposed in. <a target="_blank" class=\'text-primary\' href=\'${articleLink}\'>Learn more</a>`

  else if (value === -1)
    message = `Non-Sequential transactions can be executed in any order. <a target="_blank" class=\'text-primary\' href=\'${articleLink}\'>Learn more</a>`

  return message
    ? {
        content: message,
        interactive: true,
        allowHTML: true,
        placement: 'bottom',
        popperOptions: {
          strategy: 'fixed',
          modifiers: [
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['bottom', 'right'],
              },
            },
            {
              name: 'preventOverflow',
              options: {
                altAxis: true,
                tether: false,
              },
            },
          ],
        },
      }
    : undefined
}
</script>

<template>
  <form class="flex flex-col" @submit.prevent="onSubmit">
    <div class="px-7.5 pt-7.5 pb-5 flex flex-col gap-2.5">
      <h1 v-if="rejection" class="text-lg">
        Submit Reject Transaction Proposal
      </h1>
      <h1 v-else class="text-lg">
        Submit Transaction Proposal
      </h1>
      <div class="text-slate-500 flex items-center gap-2 text-xs font-medium">
        <ChainLogo class="w-5 h-5" :chain="chainId" />
        {{ chainIdToName(chainId) }}
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="sm:px-7.5 px-5 py-5 flex flex-col gap-5">
      <div v-if="!rejection" class="flex flex-col gap-2">
        <span class="text-xs text-slate-400 font-medium">
          Transaction type
        </span>
        <div class="flex row gap-4">
            <CommonRadioSelect
              v-for="(nonceType, index) in transactionTypes" :key="index"
              :value="nonceType.value"
              v-model="nonce"
            >
              <template v-slot:content>
                <div class="flex row items-center gap-2">
                  <span class="text-xs font-medium">{{ nonceType.name }}</span>
                  <SvgoInfo2 v-tippy="getNonceTooltip(nonceType.value)" class="dark:text-slate-500 text-slate-300" />
                </div>
                  <span v-if="nonceType.value === recommendedNonce"
                    class="ml-auto bg-primary bg-opacity-10 text-primary text-[0.625rem] font-medium px-1.5 py-1 uppercase rounded-10">
                    Recommended
                  </span>
              </template>
            </CommonRadioSelect>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <dl v-if="rejectionId" class="flex mb-2 justify-between">
          <dt class="text-xs text-slate-400">
            Proposal Hash
          </dt>
          <dd
            v-tippy="{
              content: rejectionId,
              interactive: true,
              maxWidth: 'none',
            }" class="text-xs text-slate-400"
          >
            {{ shortenHash(rejectionId) }}
          </dd>
        </dl>
        <span class="text-xs font-medium flex items-center gap-2 text-slate-400">
          Note (optional)
          <SvgoInfo2 v-tippy="'Specify any details/instructions you want other signers to read before signing this transaction.'" class="w-4 h-4 dark:text-slate-500 text-slate-300" />
        </span>
        <textarea v-model="note" v-focus placeholder="Visible to all signers" class="dark:bg-slate-800 placeholder:text-sm placeholder:text-slate-400 text-sm font-medium rounded-[14px] bg-slate-100 py-[15px] px-4 border-0 outline-none focus:border-0 focus:outline-none focus:ring-0" />
      </div>
    </div>
    <template v-if="!estimatedFee">
      <hr class="border-slate-150 dark:border-slate-800">
      <div v-if="!simulationStatus" class="sm:px-7.5 px-5 py-5 text-sm flex justify-between items-center">
        Simulate Transaction
        <div class="flex items-center gap-2.5">
          <SvgSpinner v-if="pending" class="text-primary" />
          <button :disabled="pending" type="button" class="text-primary disabled:text-slate-400" @click="toggle()">
            Simulate
          </button>
        </div>
      </div>
      <div v-else :class="simulationDetails?.transaction?.status ? 'bg-primary' : 'bg-red-alert'" class="bg-opacity-10 items-baseline justify-between rounded-[14px] text-sm p-4 sm:mx-7.5 mx-5 my-5 font-medium flex gap-3">
        <div class="flex gap-3 flex-col flex-1">
          <div class="flex gap-3">
            <template v-if="isTransactionFailed">
              <SvgoErrorCircle class="w-4.5 h-4.5" />
              This transaction will most likely fail
            </template>
            <template v-else>
              <SvgoCheckCircle class="success-circle w-4.5 h-4.5" />
              This transaction will most likely succeed
            </template>
          </div>

          <p v-if="simulationDetails?.transaction.simulationId" class="text-xs text-slate-400 font-medium">
            View complete simulation report
            <NuxtLink target="_blank" class="inline-flex items-center gap-2 text-primary" external :to="`https://dashboard.tenderly.co/public/InstaDApp/avocado/simulator/${simulationDetails?.transaction.simulationId}?hideSidebar=true`">
              on Tenderly
              <SvgoExternalLink />
            </NuxtLink>
          </p>
        </div>

        <button @click="toggle()">
          <SvgoX />
        </button>
      </div>
      <hr class="border-slate-150 dark:border-slate-800">
      <details ref="detailsRef" class="group sm:px-7.5 px-5 py-5">
        <summary class="text-orange-400 flex justify-between text-sm leading-5 cursor-pointer">
          <span class="group-open:hidden block font-medium">View transaction breakdown</span>
          <span class="group-open:block hidden font-medium">Hide transaction breakdown</span>

          <SvgoChevronDown class="group-open:rotate-180" />
        </summary>
        <div class="mt-5">
          <SimulationDetails
            v-if="simulationDetails"
            :chain-id="String(chainId)"
            :details="simulationDetails"
            :has-error="!!simulationError"
            title-hidden
            wrapper-class="sm:!flex flex-col"
          />
        </div>
      </details>
    </template>
    <hr class="border-slate-150 dark:border-slate-800">

    <div v-if="estimatedFee" class="sm:px-7.5 px-5 py-5">
      <EstimatedFee :data="data" :loading="feePending" :error="error" />
    </div>

    <button
      v-if="isExecuteReady"
      type="button"
      :class="{
        'dark:text-white text-slate-900': signAndExecute,
      }"
      class="text-xs text-left font-medium items-base text-slate-400 flex gap-2.5 group sm:px-7.5 px-5 py-5"
      @click="signAndExecuteToggle()"
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
    <CommonButton :disabled="feePending || isSubmitting" :loading="feePending || isSubmitting" class="justify-center mx-7.5 my-5" size="lg" type="submit">
      {{ signAndExecute && isExecuteReady ? 'Sign and Execute Transaction' : 'Sign and Send for Approval' }}
    </CommonButton>
  </form>
</template>
