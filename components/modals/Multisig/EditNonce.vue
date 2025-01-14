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
  transactionType?: 'add-signers' | 'remove-signers' | 'change-threshold' | 'gas-topup'
  metadata: string
  options?: any
}>()

const emit = defineEmits(['resolve', 'destroy'])

const { public: config } = useRuntimeConfig()
const { selectedSafe, safeOptions } = storeToRefs(useSafe())
const { getActualId, safeAddress, generateMultisigSignatureAndSign, multisigBroadcast } = useAvocadoSafe()
const { parseTransactionError } = useErrorHandler()
const { multisigURL } = storeToRefs(useEnvironmentState())
const { clearAllModals } = useModal()
const { account } = useWeb3()

const isSimulationDisabled = computed(() => networksSimulationNotSupported.includes(Number(props.chainId)))

const shouldNonSeqByDefault = props.transactionType === 'remove-signers' || props.transactionType === 'add-signers' || props.transactionType === 'gas-topup'
const recommendedNonce = shouldNonSeqByDefault ? -1 : undefined

const isSubmitting = ref(false)
const nonce = ref<number | undefined>(recommendedNonce)
const note = ref<string | undefined>(undefined)
const detailsRef = ref<HTMLDetailsElement>()
const [simulationStatus, toggle] = useToggle()
const [signAndExecute, signAndExecuteToggle] = useToggle(false)

const optionsByChain = computed(() => safeOptions.value.find(i => i.chainId == props.chainId))

const { data: seqResponse } = useAsyncData<IMultisigTransactionResponse>(`${safeAddress.value}-seq-count`, async () => {
  const { data } = await axios.get(`/safes/${safeAddress.value}/transactions`, {
    params: {
      status: 'pending',
      nonce_type: 'seq',
      chain_id: props.chainId,
    },
    baseURL: multisigURL.value,
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
  if (!optionsByChain.value)
    return false
  return optionsByChain.value?.threshold === 1 && !isExecutionNotAvailable.value
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
      owner: selectedSafe.value?.owner_address,
      index: String(selectedSafe.value?.multisig_index),
      data: params?.castParams,
      note: payload.note,
      nonce: params.castParams.params.avoSafeNonce,
    }, {
      baseURL: multisigURL.value,
    })

    const message = `${'`Multisig Hash`'} <${config.domainURL}/multisig/${data.safe_address}/pending-transactions/${data.id}| ${shortenHash(data.id)}>`

    logActionToSlack({
      account: account.value,
      action: 'proposal',
      message: generateSlackMessage(props.metadata, props.chainId, message),
    })

    proposalId = data.id

    if (data.confirmations_required === 1 && !signOnly) {
      const txHash = await multisigBroadcast({
        proposalId: data.id,
        ignoreSlack: true,
        confirmations: data.confirmations,
        signers: data.signers,
        message: data.data,
        owner: selectedSafe.value?.owner_address!,
        safe: selectedSafe.value?.safe_address!,
        targetChainId: props.chainId,
        debug: {
          domain: params.domain,
        },
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

    logActionToSlack({
      action: 'multisig',
      account: account.value,
      type: 'error',
      message: parsed.formatted,
    })
  }
  finally {
    isSubmitting.value = false
  }
}

const { data: simulationDetails, error: simulationError, pending } = useAsyncData(
  () => {
    if (isSimulationDisabled.value)
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
  if (value === undefined)
    message = 'Sequential transactions need to be executed in the order they were proposed in.'

  else if (value === -1)
    message = 'Non-Sequential transactions can be executed in any order.'

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
    <div class="flex flex-col gap-2.5 px-7.5 pb-5 pt-7.5">
      <h1 v-if="rejection" class="text-lg">
        Submit Reject Transaction
      </h1>
      <h1 v-else class="text-lg">
        Submit Transaction
      </h1>
      <div class="flex items-center gap-2 text-xs font-medium text-gray-500">
        <ChainLogo class="h-5 w-5" :chain="chainId" />
        {{ chainIdToName(chainId) }}
      </div>
    </div>
    <hr class="border-gray-800">
    <div class="flex flex-col gap-5 p-5 sm:px-7.5">
      <div v-if="!rejection" class="flex flex-col gap-2">
        <span class="text-xs font-medium text-gray-400">
          Transaction type
        </span>
        <div class="row flex gap-4">
          <CommonRadioSelect
            v-for="(nonceType, index) in transactionTypes" :key="index"
            v-model="nonce"
            :value="nonceType.value"
          >
            <template #content>
              <div class="row flex items-center gap-2">
                <span class="text-xs font-medium">{{ nonceType.name }}</span>
                <SvgoInfo2 v-tippy="getNonceTooltip(nonceType.value)" class="text-gray-500" />
              </div>
              <span
                v-if="nonceType.value === recommendedNonce"
                class="ml-auto rounded-10 bg-primary bg-opacity-10 px-1.5 py-1 text-[0.625rem] font-medium uppercase text-primary"
              >
                Recommended
              </span>
            </template>
          </CommonRadioSelect>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <dl v-if="rejectionId" class="mb-2 flex justify-between">
          <dt class="text-xs text-gray-400">
            Proposal Hash
          </dt>
          <dd
            v-tippy="{
              content: rejectionId,
              interactive: true,
              maxWidth: 'none',
            }" class="text-xs text-gray-400"
          >
            {{ shortenHash(rejectionId) }}
          </dd>
        </dl>
        <span class="flex items-center gap-2 text-xs font-medium text-gray-400">
          Note (optional)
          <SvgoInfo2 v-tippy="'Specify any details/instructions you want other signers to read before signing this transaction.'" class="h-4 w-4 text-gray-500" />
        </span>
        <textarea v-model="note" v-focus placeholder="Visible to all signers" class="rounded-[14px] border-0 bg-gray-900 px-4 py-[15px] text-sm font-medium outline-none placeholder:text-sm placeholder:text-gray-400 focus:border-0 focus:outline-none focus:ring-0" />
      </div>
    </div>
    <template v-if="!isSimulationDisabled">
      <template v-if="!estimatedFee">
        <hr class="border-gray-800">
        <div v-if="!simulationStatus" class="flex items-center justify-between p-5 text-sm sm:px-7.5">
          Simulate Transaction
          <div class="flex items-center gap-2.5">
            <SvgSpinner v-if="pending" class="text-primary" />
            <button :disabled="pending" type="button" class="text-primary disabled:text-gray-400" @click="toggle()">
              Simulate
            </button>
          </div>
        </div>
        <div v-else :class="simulationDetails?.transaction?.status ? 'bg-primary' : 'bg-red-alert'" class="m-5 flex items-baseline justify-between gap-3 rounded-[14px] bg-opacity-10 p-4 text-sm font-medium sm:mx-7.5">
          <div class="flex flex-1 flex-col gap-3">
            <div class="flex gap-3">
              <template v-if="isTransactionFailed">
                <SvgoErrorCircle class="h-4.5 w-4.5" />
                This transaction will most likely fail
              </template>
              <template v-else>
                <SvgoCheckCircle class="success-circle h-4.5 w-4.5" />
                This transaction will most likely succeed
              </template>
            </div>

            <p v-if="simulationDetails?.transaction.simulationId" class="text-xs font-medium text-gray-400">
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
        <hr class="border-gray-800">
        <details ref="detailsRef" class="group p-5 sm:px-7.5">
          <summary class="flex cursor-pointer justify-between text-sm leading-5 text-orange-400">
            <span class="block font-medium group-open:hidden">View transaction breakdown</span>
            <span class="hidden font-medium group-open:block">Hide transaction breakdown</span>

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
      <hr class="border-gray-800">
    </template>

    <div v-if="estimatedFee" class="p-5 sm:px-7.5">
      <EstimatedFee :data="data" :loading="feePending" :error="error" />
    </div>

    <button
      v-if="isExecuteReady"
      type="button"
      :class="{
        'text-white': signAndExecute,
      }"
      class="items-base group flex gap-2.5 p-5 text-left text-xs font-medium text-gray-400 sm:px-7.5"
      @click="signAndExecuteToggle()"
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
    <CommonButton :disabled="feePending || isSubmitting" :loading="feePending || isSubmitting" class="mx-7.5 my-5 justify-center" size="lg" type="submit">
      {{ signAndExecute && isExecuteReady ? 'Sign and Execute Transaction' : 'Sign and Send for Approval' }}
    </CommonButton>
  </form>
</template>
