<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = defineProps<{
  chainId: number | string
  actions: any[]
}>()

const emit = defineEmits(['resolve'])
const { selectedSafe } = storeToRefs(useAuthorities())
const nonce = ref<number | undefined>(-1)
const note = ref<string | undefined>(undefined)
const detailsRef = ref<HTMLDetailsElement>()

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

const { data: simulationDetails, error: simulationError } = useAsyncData(
  () => {
    if (networksSimulationNotSupported.includes(Number(props.chainId)))
      throw new Error('Simulation not supported on this network.')

    const actions = props.actions.map((action) => {
      return {
        operation: action.operation || '0',
        target: action?.target || action.to,
        data: action.data || '0x',
        value: action.value || '0',
      }
    }) as any

    return http('/api/simulate', {
      method: 'POST',
      body: {
        actions,
        avocadoSafe: selectedSafe.value?.safe_address,
        chainId: props.chainId,
      },
    }) as Promise<ISimulation>
  },
  {
    immediate: true,
    server: false,
  },
)

const isTransactionFailed = computed(() => !simulationDetails.value?.transaction?.status)
</script>

<template>
  <form class="flex flex-col" @submit.prevent="onSubmit">
    <div class="px-7.5 pt-7.5 pb-5 flex flex-col gap-2.5">
      <h1 class="text-lg">
        Submit Transaction Proposal
      </h1>
      <div class="text-slate-500 flex items-center gap-2 text-xs font-medium">
        <ChainLogo class="w-5 h-5" :chain="chainId" />
        {{ chainIdToName(chainId) }}
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="px-7.5 py-5 flex flex-col gap-2.5">
      <div class="flex flex-col gap-2">
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
            <template v-if="nonce === -1">
              <SvgoInfo2 class="text-slate-500" />
              <span class="bg-primary bg-opacity-10 text-primary text-xs px-[6px] py-[5px] uppercase rounded-[10px]">
                Recommended
              </span>
            </template>
          </template>
          <template #item="{ label, value }">
            <span v-if="value === -1" class="flex items-center gap-2.5">
              {{ label }}
              <SvgoInfo2 class="text-slate-500" />
              <span class="bg-primary bg-opacity-10 text-primary text-xs px-[6px] py-[5px] uppercase rounded-[10px]">
                Recommended
              </span>
            </span>
          </template>
        </CommonSelect>
      </div>

      <div class="flex flex-col gap-2">
        <span class="text-xs text-slate-400">
          Note
        </span>
        <textarea v-model="note" placeholder="Visible to All signers" class="dark:bg-slate-800 placeholder:text-sm text-sm rounded-[14px] bg-slate-100 py-[15px] px-4 border-0 outline-none focus:border-0 focus:outline-none focus:ring-0" />
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <div class="px-7.5 py-5 text-sm flex justify-between items-center">
      Check if this transaction is valid
      <button type="button" class="text-primary" @click="handleSimulate">
        Simulate
      </button>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <details ref="detailsRef" class="group px-7.5 py-5">
      <summary class="text-orange-400 flex justify-between text-sm leading-5 cursor-pointer">
        View transaction breakdown <SvgoChevronDown class="group-open:rotate-180" />
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
    <hr class="border-slate-150 dark:border-slate-800">
    <CommonButton class="justify-center mx-7.5 my-5" size="lg" type="submit">
      Send for Approval
    </CommonButton>
  </form>
</template>
