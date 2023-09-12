<script setup lang="ts">
import { serialize } from 'error-serializer'
import { SlickList } from 'vue-slicksort'

const props = defineProps<{
  batch: IBatch[]
  chainId: number | string
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
  const txs = await Promise.all(reactiveBatch.value.map(i => parseTransactionObject(i.formValues, 'expand')))

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

async function handleSubmit() {
  try {
    isSubmitting.value = true
    const tx = await sendTransactions(actualTransactions.value, props.chainId, undefined, 'others')

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
    <h1 class="text-lg mb-[5px]">
      Review and Confirm
    </h1>
    <div class="flex flex-col gap-[25px]">
      <h2 class="flex items-center gap-2.5">
        <span class="w-7.5 h-7.5 rounded-full bg-primary text-white flex items-center justify-center text-sm">
          2
        </span>
        Transactions Batch
      </h2>
      <SlickList v-model:list="reactiveBatch" use-drag-handle class="flex flex-col gap-5 max-h-[450px] overflow-auto scroll-style" tag="ul" axis="y">
        <BatchItem
          v-for="(item, i) in reactiveBatch" :key="item.formValues.method + i" class="z-[51] pl-2.5" :item="item" :index="i"
          @edit-batch="$emit('resolve', true, {
            edit: true,
            index: i,
          })" @delete-batch="handleDeleteBatchItem"
        />
      </SlickList>
    </div>

    <EstimatedFee :data="data" :loading="pending" :error="error" />
    <div class="flex gap-2.5">
      <CommonButton class="sm:w-[134px] items-center justify-center" :loading="isSubmitting" :disabled="!!error || pending" @click="handleSubmit">
        Send Batch
      </CommonButton>
      <CommonButton color="white" @click="$emit('destroy')">
        Cancel
      </CommonButton>

      <button v-if="!isSimulationDisabled" class="ml-auto text-primary font-medium text-sm" :disabled="simulationLoading" type="button" @click="createSimulation">
        <SvgSpinner v-if="simulationLoading" class="text-primary mr-2.5" />
        <span v-else>
          Simulate
        </span>
      </button>
    </div>
    <div v-if="simulationDetails && simulationStatus">
      <div :class="simulationDetails?.transaction?.status ? 'bg-primary' : 'bg-red-alert'" class="bg-opacity-10 items-baseline justify-between rounded-[14px] text-sm p-4 font-medium flex gap-3">
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

      <details class="group py-5">
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
            title-hidden
            :has-error="false"
            wrapper-class="sm:!flex flex-col"
          />
        </div>
      </details>
    </div>
  </div>
</template>
