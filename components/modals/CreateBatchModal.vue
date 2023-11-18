<script setup lang="ts">
import { serialize } from 'error-serializer'
import { utils } from 'ethers'
import { SlickList } from 'vue-slicksort'

const props = defineProps<{
  batch: IBatch[]
  chainId: number | string
  mode: TxBuilderModes
}>()

const emit = defineEmits(['destroy', 'resolve'])

const reactiveBatch = toRef(props.batch)
const simulationDetails = ref<ISimulation>()
const simulationLoading = ref(false)
const isSubmitting = ref(false)

const { selectedSafe } = storeToRefs(useSafe())

const [simulationStatus, toggle] = useToggle()

const isSimulationDisabled = computed(() => networksSimulationNotSupported.includes(Number(props.chainId)))
const isTransactionFailed = computed(() => !simulationDetails.value?.transaction?.status)
const actualTransactions = asyncComputed(async () => {
  const txs = await Promise.all(reactiveBatch.value.map(i => parseTransactionObject(i.formValues, props.mode)))

  return txs
})

const { data, pending, error } = useEstimatedFee(actualTransactions, ref(props.chainId), {
  immediate: true,
})

const { sendTransactions } = useAvocadoSafe()

function handleDeleteBatchItem(index: number) {
  reactiveBatch.value = reactiveBatch.value.filter((_, i) => i !== index)
}

async function createSimulation() {
  try {
    simulationDetails.value = undefined
    simulationLoading.value = true
    simulationStatus.value = true

    const resp = await http<ISimulation>('/api/simulate', {
      method: 'POST',
      body: {
        actions: actualTransactions.value.map((i: any) => {
          return {
            target: i?.target || i.to,
            data: i.data,
            value: i?.value || '0',
            operation: i?.operation ? String(i?.operation) : '0',
          }
        }),
        avocadoSafe: selectedSafe.value?.safe_address,
        chainId: props.chainId,
        id: '0',
      },
    })

    simulationDetails.value = resp
  }
  catch (e) {
    const parsed = serialize(e)
    openSnackbar({
      type: 'error',
      message: parsed.message,
    })
  }
  finally {
    simulationLoading.value = false
  }
}

function getTransactionDataByIndex(index: number) {
  if (!actualTransactions.value?.length)
    return

  return actualTransactions.value[index]?.data
}

async function handleSubmit() {
  try {
    isSubmitting.value = true

    const formatted = utils.formatBytes32String(String(actualTransactions.value.length))

    const metadata = encodeTransactionBuilderMetadata(formatted)

    const tx = await sendTransactions(actualTransactions.value, props.chainId,
      {
        metadata,
      },
      'others')

    if (tx)
      showPendingTransactionModal(tx, props.chainId)

    emit('destroy')
  }
  catch (e) {
    const parsed = serialize(e)
    openSnackbar({
      type: 'error',
      message: parsed.message,
    })
  }
  finally {
    isSubmitting.value = false
  }
}

watch(reactiveBatch, () => {
  if (!reactiveBatch.value.length) {
    emit('resolve', true, {
      batch: [],
    })
  }
})
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <h1 class="mb-[5px] text-lg">
      Review and Confirm
    </h1>
    <div class="flex flex-col gap-[25px]">
      <h2 class="flex items-center gap-2.5">
        <span class="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-primary text-sm text-white">
          2
        </span>
        Transactions Batch
      </h2>
      <SlickList v-model:list="reactiveBatch" use-drag-handle class="scroll-style flex max-h-[450px] flex-col gap-5 overflow-auto" tag="ul" axis="y">
        <BatchItem
          v-for="(item, i) in reactiveBatch"
          :key="item.formValues.method + i"
          :data="getTransactionDataByIndex(i)"
          expandable class="z-[51] pl-2.5" :item="item" :index="i"
          @edit-batch="$emit('resolve', true, {
            edit: true,
            index: i,
          })" @delete-batch="handleDeleteBatchItem"
        />
      </SlickList>
    </div>

    <EstimatedFee :data="data" :loading="pending" :error="error" />
    <div class="flex gap-2.5">
      <CommonButton class="items-center justify-center sm:w-[134px]" :loading="isSubmitting" :disabled="!!error || pending" @click="handleSubmit">
        Send Batch
      </CommonButton>
      <CommonButton color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>

      <button v-if="!isSimulationDisabled" class="ml-auto text-sm font-medium text-primary" :disabled="simulationLoading" type="button" @click="createSimulation">
        <SvgSpinner v-if="simulationLoading" class="mr-2.5 text-primary" />
        <span v-else>
          Simulate
        </span>
      </button>
    </div>
    <div v-if="simulationDetails && simulationStatus">
      <div :class="simulationDetails?.transaction?.status ? 'bg-primary' : 'bg-red-alert'" class="flex items-baseline justify-between gap-3 rounded-[14px] bg-opacity-10 p-4 text-sm font-medium">
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

          <p v-if="simulationDetails?.transaction.simulationId" class="text-xs font-medium text-slate-400">
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

      <details class="group py-5">
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
            title-hidden
            :has-error="false"
            wrapper-class="sm:!flex flex-col"
          />
        </div>
      </details>
    </div>
  </div>
</template>
