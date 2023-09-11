<script setup lang="ts">
import { TransactionBuilder } from '@instadapp/transaction-builder'
import { AbiFetcher } from '@instadapp/utils'
import { isAddress } from 'ethers/lib/utils'
import { useField, useForm } from 'vee-validate'
import { serialize } from 'error-serializer'
import { ethers } from 'ethers'
import { SlickList } from 'vue-slicksort'
import PowerOffSVG from '~/assets/images/icons/power-off.svg?component'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const pending = ref(false)
const batch = ref<IBatch[]>([])

interface ITxBuilderMode {
  label: string
  value: TxBuilderModes
}

const modes: ITxBuilderMode[] = [{
  label: 'Expand',
  value: 'expand',
}, {
  label: 'Collapse',
  value: 'collapse',
}, {
  label: 'Super Collapse',
  value: 'super-collapse',
}]
const mode = ref<TxBuilderModes>('expand')

provide('mode', mode)

const { handleSubmit, values, meta, setFieldValue, resetField, setFieldError } = useForm({
  keepValuesOnUnmount: true,
})

const { value: ABI, errorMessage: abiErrorMessage, setState: setABI } = useField<string>('abi', val => isJsonString(val!), {
  initialValue: '',
})

const { value: toAddress, errorMessage: toAddressError } = useField<string>('toAddress', val => isAddress(val!))

const { value: contractAddress, errorMessage: contractAddressError } = useField<string>('contractAddress', val => isAddress(val!))

const { value: ethValue, errorMessage: ethValueError } = useField<string>('ethValue', (val) => {
  // validate uint
  try {
    ethers.utils.defaultAbiCoder.encode(['uint'], [String(val)])
    return true
  }
  catch (e) {
    const parsed = serialize(e)
    return parsed?.reason || parsed.message
  }
}, {
  initialValue: 0,
})

const { value: chainId } = useField<number>('chainId', val => !!val, {
  initialValue: 137,
})

const { value: method, setState: setMethod } = useField('method', val => !!val, {
  initialValue: '',
})

const builder = computed(() => isJsonString(ABI.value) ? new TransactionBuilder(JSON.parse(JSON.stringify(ABI.value))) : null)

function cleanupFormValues(methods: any[]) {
  setFieldError('params', undefined)
  resetField('params', {
    value: undefined,
  })

  for (const inputs of methods) {
    setFieldError(inputs.name, undefined)
    resetField(inputs.name, {
      value: undefined,
    })
  }
}

async function handleDeleteBatchItem(index: number) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to Delete Batch?',
    type: 'question',
    cancelButtonText: 'Cancel',
    isCancelButtonVisible: true,
    headerIconComponent: h(PowerOffSVG),
    buttonText: 'Delete',
    buttonProps: {
      color: 'red',
    },
    cancelButtonProps: {
      color: 'white',
    },
  })

  if (success)
    batch.value = batch.value.filter((_, i) => i !== index)
}

function transformParams(params: string) {
  // convert params into object way
  const parsed = tryJsonParse(params)

  console.log({
    parsed,
    params,
  })

  const inputMethods = builder.value?.getMethodInputs(method.value) || []

  const obj = inputMethods.reduce((acc, i, index) => {
    if (!i.name)
      throw new Error('Invalid input')

    acc[i.name] = parsed[index]

    return acc
  }, {} as any)

  return obj
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (!builder.value)
      return

    const args = mode.value === 'super-collapse'
      ? tryJsonParse(values.params)
      : builder.value.getMethodInputs(method.value).map((i) => {
        if (!i.name)
          throw new Error('Invalid input')

        const value = tryJsonParse(values[i.name])

        return value
      })

    const data = await builder.value.build(method.value, args)

    const tx: TransactionsAction = {
      data,
      operation: '0',
      value: String(ethValue.value || '0'),
      to: contractAddress.value,
    }

    const arr: IBatch[] = [{
      tx,
      method: method.value,
    }]

    batch.value = arr.concat(batch.value)
  }
  catch (e) {
    const parsed = serialize(e)

    notify({
      type: 'error',
      message: parsed.message,
    })
  }
})

watchDebounced(contractAddress, async () => {
  if (!isAddress(contractAddress.value))
    return

  try {
    pending.value = true

    setMethod({ value: '' })

    const fetcher = new AbiFetcher()

    const resp = await fetcher.get(contractAddress.value, 'polygon')

    setABI({ value: JSON.stringify(resp, null, 2), errors: [], touched: true })
    toAddress.value = contractAddress.value
  }
  catch (e) {
    const parsed = serialize(e)

    notify({
      message: parsed.message,
      type: 'error',
    })
  }
  finally {
    pending.value = false
  }
}, {
  debounce: 1000,
  immediate: true,
})

watch(method, (_, oldMethod) => {
  if (oldMethod) {
    const inputMethods = builder.value?.getMethodInputs(oldMethod) || []

    cleanupFormValues(inputMethods)
  }
},
)

watch(mode, async (newMode, oldMode) => {
  if (!builder.value || !method.value)
    return

  const inputMethods = builder.value?.getMethodInputs(method.value) || []

  if (!meta.value.valid) {
    cleanupFormValues(inputMethods)
    return
  }

  const isCollapseToExpand = newMode === 'expand'
  const isExpandToCollapse = newMode === 'collapse'
  const isSuperCollapse = newMode === 'super-collapse'
  const wasSuperCollapse = oldMode === 'super-collapse'

  if (isSuperCollapse) {
    const actualValues = inputMethods.map((i) => {
      if (!i.name)
        throw new Error('Invalid input')

      const targetValue = values[i.name]

      const value = tryJsonParse(targetValue)

      return value
    }).filter(i => i !== undefined)

    cleanupFormValues(inputMethods)

    setFieldValue('params', actualValues?.length ? tryJsonStringfy(actualValues) : undefined, false)

    return
  }

  inputMethods.forEach((i) => {
    if (!i.name)
      throw new Error('Invalid input')

    const actualValues = wasSuperCollapse && values.params ? transformParams(values.params) : values

    const value = actualValues[i.name]

    setFieldValue(i.name, isCollapseToExpand ? tryJsonParse(value) : isExpandToCollapse ? tryJsonStringfy(value) : undefined, false)
  })
})
</script>

<template>
  <div class="flex-1 relative flex flex-col gap-5">
    <ul class="dark:bg-gray-850 bg-slate-50 flex w-fit sm:justify-normal justify-center font-medium text-sm p-1.5 rounded-5 sm:rounded-10">
      <li v-for="item in modes" :key="item.value">
        <button :class="mode === item.value ? 'dark:bg-slate-800 bg-slate-150' : 'text-slate-400'" class="whitespace-nowrap flex items-center gap-2.5 px-6 py-2.5 rounded-2xl sm:rounded-7.5" @click="mode = item.value">
          {{ item.label }}
        </button>
      </li>
    </ul>
    <form @submit="onSubmit">
      <div class="dark:bg-gray-850 bg-slate-50 rounded-[25px] py-7.5 flex flex-col">
        <div class="grid grid-cols-3 gap-10 w-full max-w-full px-7.5">
          <div class="flex flex-col col-span-2 w-full gap-7.5">
            <div class="flex items-center w-full gap-7.5">
              <label class="text-sm font-medium text-slate-400 w-[200px]" for="input-contractAddress">Contract Address</label>
              <CommonInput v-model="contractAddress" class="flex-1" :error-message="contractAddressError" name="contractAddress" placeholder="Enter Address">
                <template #suffix>
                  <SvgSpinner v-if="pending" />
                </template>
              </CommonInput>
            </div>

            <div class="flex items-center w-full gap-7.5">
              <label class="text-sm font-medium text-slate-400 shrink-0 w-[200px]" for="input-contractAddress">Network</label>
              <CommonSelect
                v-model="chainId"
                class="w-full"
                value-key="chainId"
                label-key="name"
                icon-key="icon"
                :options="availableNetworks"
              >
                <template #button-prefix>
                  <ChainLogo class="w-6 h-6" :chain="chainId" />
                </template>
                <template #item-prefix="{ value }">
                  <ChainLogo class="w-6 h-6" :chain="value" />
                </template>
              </CommonSelect>
            </div>

            <div class="flex w-full gap-7.5">
              <label class="text-sm font-medium text-slate-400 w-[200px] shrink-0" for="input-abi">Enter ABI</label>
              <CommonTextarea id="input-abi" v-model="ABI" :error-message="abiErrorMessage" rows="5" name="abi" placeholder="ABI []" />
            </div>

            <div class="flex items-center w-full gap-7.5">
              <label class="text-sm font-medium text-slate-400 w-[200px] shrink-0" for="input-toAddress">To Address</label>
              <CommonInput v-model="toAddress" class="w-full" :error-message="toAddressError" name="toAddress" placeholder="Enter Address" />
            </div>

            <div class="flex items-center w-full gap-7.5">
              <label class="text-sm font-medium text-slate-400 w-[200px] shrink-0" for="input-ethValue">ETH Value</label>
              <CommonInput v-model="ethValue" class="w-full" :error-message="ethValueError" name="ethValue" placeholder="uint" />
            </div>

            <div v-if="builder" class="flex items-center w-full gap-7.5">
              <label class="text-sm font-medium text-slate-400 w-[200px] shrink-0">Method</label>
              <CommonSelect
                v-model="method"
                class="w-full"
                :options="builder?.getWriteMethods()"
              />
            </div>
          </div>

          <div v-if="!batch?.length" class="bg-primary font-medium border gap-2.5 flex-col border-primary border-dashed flex items-center justify-center bg-opacity-10 rounded-[14px] p-10 h-[360px]">
            <SvgoFilePlus class="text-primary" />
            <h2 class="text-sm">
              Batching
            </h2>
            <p class="text-xs text-center leading-5">
              Drag and drop a JSON file or <br>
              <span class="text-primary">
                chose a file
              </span>
            </p>
          </div>

          <div v-else class="flex flex-col shrink-0 h-fit dark:bg-gray-950 bg-white rounded-[14px] p-5">
            <h2 class="text-sm mb-5">
              Transactions Batch
            </h2>

            <SlickList v-model:list="batch" use-drag-handle class="flex flex-col gap-5 max-h-[450px] overflow-auto scroll-style" tag="ul" axis="y">
              <BatchItem v-for="(item, i) in batch" :key="item.method + i" :item="item" :index="i" @delete-batch="handleDeleteBatchItem" />
            </SlickList>

            <div class="ml-7.5 mt-5">
              <CommonButton size="sm" @click="openCreateBatchModal({ batch, chainId })">
                Create Batch
              </CommonButton>
            </div>
          </div>
        </div>

        <hr class="border-slate-150 dark:border-slate-800 my-7.5">

        <div class="gap-5 flex flex-col">
          <template v-if="builder && method">
            <BuilderParamsInput v-if="mode === 'super-collapse'" :builder="builder" :method="method" />

            <BuilderInput
              v-for="input in builder.getMethodInputs(method)"
              v-show="mode !== 'super-collapse'"
              :key="input.name"
              :name="input.name"
              :method="method"
              :builder="builder"
              :input="input"
            />
          </template>
        </div>
      </div>
      <CommonButton :disabled="!meta.valid" type="submit" class="mt-8 w-fit mx-7.5">
        Add Transaction
      </CommonButton>
    </form>
  </div>
</template>
