<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = defineProps<{
  chainId: number | string
  actions: any[]
  defaultNonce?: number
  estimatedFee?: boolean
  rejection?: boolean
  rejectionId?: string
}>()

const emit = defineEmits(['resolve'])
const { selectedSafe } = storeToRefs(useSafe())
const { getActualId } = useAvocadoSafe()
const nonce = ref<number | undefined>(-1)
const note = ref<string | undefined>(undefined)
const detailsRef = ref<HTMLDetailsElement>()

const { data, error, pending: feePending } = useEstimatedFee(ref(props.actions), ref(props.chainId), {
  immediate: true,
  disabled: () => !props.estimatedFee,
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

function onSubmit() {
  emit('resolve', true, {
    nonce: nonce.value,
    note: note.value,
  })
}

function handleSimulate() {
  if (simulationDetails.value?.transaction?.status) {
    openSnackbar({
      type: 'success',
      message: 'Simulation successful',
    })
  }
  else {
    if (detailsRef.value)
      detailsRef.value.open = true
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

    const id = getActualId(actions)

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
        placement: 'top',
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
    <div class="px-7.5 py-5 flex flex-col gap-2.5">
      <div v-if="!rejection" class="flex flex-col gap-2">
        <span class="text-xs text-slate-400">
          Transaction type
        </span>
        <CommonSelect
          v-model="nonce"
          label-key="name"
          value-key="value"
          :options="transactionTypes"
        >
          <template #button-suffix>
            <SvgoInfo2 v-tippy="getNonceTooltip(nonce)" class="text-slate-500" />

            <template v-if="nonce === -1">
              <span class="bg-primary bg-opacity-10 text-primary text-xs px-[6px] py-[5px] uppercase rounded-[10px]">
                Recommended
              </span>
            </template>
          </template>
          <template #item="{ label, value }">
            <span class="flex items-center gap-2.5">
              {{ label }}
              <SvgoInfo2
                v-tippy="getNonceTooltip(value)" class="text-slate-500"
              />

              <span v-if="value === -1" class="bg-primary bg-opacity-10 text-primary text-xs px-[6px] py-[5px] uppercase rounded-[10px]">
                Recommended
              </span>
            </span>
          </template>
        </CommonSelect>
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
        <span class="text-xs flex items-center gap-2 text-slate-400">
          Note
          <SvgoInfo2 v-tippy="'Specify any details/instructions you want other signers to read before signing this transaction.'" class="w-4 h-4 text-slate-500" />
        </span>
        <textarea v-model="note" v-focus placeholder="Visible to All signers" class="dark:bg-slate-800 placeholder:text-sm text-sm rounded-[14px] bg-slate-100 py-[15px] px-4 border-0 outline-none focus:border-0 focus:outline-none focus:ring-0" />
      </div>
    </div>
    <template v-if="!estimatedFee">
      <hr class="border-slate-150 dark:border-slate-800">
      <div class="px-7.5 py-5 text-sm flex justify-between items-center">
        Simulate Transaction
        <button :disabled="pending" type="button" class="text-primary disabled:text-slate-400" @click="handleSimulate">
          Simulate
        </button>
      </div>
      <hr class="border-slate-150 dark:border-slate-800">
      <details ref="detailsRef" class="group px-7.5 py-5">
        <summary class="text-orange-400 flex justify-between text-sm leading-5 cursor-pointer">
          <span class="group-open:hidden block">View transaction breakdown</span>
          <span class="group-open:block hidden">Hide transaction breakdown</span>

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
          <div v-if="isTransactionFailed" class="text-xs leading-5 text-red-alert bg-red-alert bg-opacity-10 flex p-4 rounded-[14px] items-center gap-2">
            <SvgoExclamationCircle class="w-3" />
            This transaction will most likely fail
          </div>
        </div>
      </details>
    </template>
    <hr class="border-slate-150 dark:border-slate-800">
    <div v-if="estimatedFee" class="px-7.5 py-5">
      <EstimatedFee :data="data" :loading="feePending" :error="error" />
    </div>
    <CommonButton :disabled="!!error || feePending" :loading="feePending" class="justify-center mx-7.5 my-5" size="lg" type="submit">
      Send for Approval
    </CommonButton>
  </form>
</template>
