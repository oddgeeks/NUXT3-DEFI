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

const { getRpcProviderByChainId } = useShared()

const pending = ref(false)
const uploading = ref(false)
const batch = ref<IBatch[]>([])
const batchIndex = ref()
const file = ref<File>()

const isDragging = ref(false)

const editMode = computed(() => batchIndex.value !== undefined)

function formatNetworkName(n: string) {
  return n === 'Ethereum' ? 'mainnet' : n.toLowerCase()
}

const abiFetcherNetworks = availableNetworks.filter(i => ABIfetcherSupportedNetworks.includes(formatNetworkName(i.name)))

const deployedNetworks = ref(availableNetworks)

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
}, {
  label: 'Raw',
  value: 'raw',
}]
const mode = ref<TxBuilderModes>('expand')

provide('mode', mode)

const { handleSubmit, values, meta, setFieldValue, resetField, setFieldError, setValues } = useForm({
  keepValuesOnUnmount: true,
})

const { value: ABI, errorMessage: abiErrorMessage, setState: setABI } = useField<string>('abi', (val) => {
  if (!isJsonString(val!))
    return 'invalid ABI'

  return true
}, {
  initialValue: '',
})

const { value: toAddress, errorMessage: toAddressError } = useField<string>('toAddress', (val) => {
  if (!isAddress(val!))
    return 'invalid address'

  return true
})

const { value: contractAddress, errorMessage: contractAddressError } = useField<string>('contractAddress', (val) => {
  if (!isAddress(val!))
    return 'invalid contract address'

  return true
})

const { value: rawDataValue, errorMessage: rawDataErrorMessage } = useField<string>('raw', (val) => {
  if (mode.value !== 'raw')
    return true

  if (!val)
    return 'Data is required'

  return true
})

const { value: ethValue, errorMessage: ethValueError } = useField<string>('value', (val) => {
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

const { value: method, setState: setMethod, validate: validateMethod } = useField('method', (val) => {
  if (mode.value === 'raw')
    return true

  return !!val
}, {
  initialValue: '',
})

const builder = computed(() => isJsonString(ABI.value) ? new TransactionBuilder(JSON.parse(JSON.stringify(ABI.value))) : null)

const isFallbackAvailable = computed(() => ABI.value.includes('"fallback"'))

const methods = computed(() => {
  if (!builder.value)
    return []

  const writeMethods = builder.value?.getWriteMethods()

  if (isFallbackAvailable.value)
    writeMethods.push(fallbackMethod)

  return writeMethods
})

const methodInputs = computed(() => getMethodInputs(builder.value, method.value))

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

function downloadJson() {
  const json: IBatchJson = {
    batch: batch.value,
    version: '1.0.0',
  }

  const stringify = JSON.stringify(json, null, 2)

  const blob = new Blob([stringify], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'TransactionBatch'
  a.click()
  a.remove()
}

async function getContractNetworks(contractAddress: string) {
  const networks = []
  for (const network of availableNetworks) {
    const provider = getRpcProviderByChainId(network.chainId)

    const code = await provider.getCode(contractAddress)

    if (code !== '0x')
      networks.push(network)
  }

  return networks
}

async function handleEditBatchItem(index: number) {
  const batchItem = batch.value[index]
  const _builder = new TransactionBuilder(JSON.parse(JSON.stringify(batchItem.formValues.abi)))
  if (_builder) {
    const inputs = getMethodInputs(_builder, batchItem.formValues.method)
    cleanupFormValues(inputs)

    batchIndex.value = index

    mode.value = 'expand'

    setValues(batchItem.formValues, true)
  }
}

async function handleDeleteBatchItem(index: number) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to delete this transaction?',
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

  if (success) {
    batchIndex.value = undefined
    batch.value = batch.value.filter((_, i) => i !== index)
  }
}

async function setupJSONFile(file: File) {
  try {
    const parsed = await parseAndValidateJson(file)

    batch.value = parsed.batch

    notify({
      type: 'success',
      message: 'File uploaded successfully',
    })
  }
  catch {
    notify({
      type: 'error',
      message: 'Invalid file',
    })
  }
}

async function handleFileUpload(e: Event) {
  try {
    uploading.value = true
    const target = e.target as HTMLInputElement
    const file = target.files?.[0] as File

    if (!file)
      return

    setupJSONFile(file)
  }
  finally {
    uploading.value = false
  }
}

function transformParams(params: string) {
  // convert params into object way
  const parsed = tryJsonParse(params)

  console.log({
    parsed,
    params,
  })

  const inputMethods = getMethodInputs(builder.value, method.value)

  const obj = inputMethods.reduce((acc, i, index) => {
    if (!i.name)
      throw new Error('Invalid input')

    acc[i.name] = parsed[index]

    return acc
  }, {} as any)

  return obj
}

function dragender(e: any) {
  e.preventDefault()
  isDragging.value = true
}

function dragover(e: any) {
  e.preventDefault()
}

function dragleave(e: any) {
  e.preventDefault()
  isDragging.value = false
}

async function parseAndValidateJson(file: File) {
  const parsed = await parseJsonFile(file) as IBatchJson

  console.log({
    parsed,
  })

  if (!parsed.version || !parsed.batch || !Array.isArray(parsed.batch))

    throw new Error('Invalid file')

  return parsed
}

async function drop(e: any) {
  try {
    e.preventDefault()
    const file = e.dataTransfer.files[0]

    if (!file)
      return

    await setupJSONFile(file)

    isDragging.value = false
  }
  finally {
    isDragging.value = false
  }
}

async function handleCreateBatchModal() {
  const { success, payload } = await openCreateBatchModal({ batch: batch.value, chainId: chainId.value, mode: mode.value })

  if (success) {
    if (payload.edit)
      return handleEditBatchItem(payload.index)

    if (payload.batch) {
      batch.value = payload.batch
      batchIndex.value = undefined
    }
  }
}

const onSubmit = handleSubmit(async (values) => {
  try {
    if (!builder.value)
      return

    // check network confict
    const isSameNetwork = batch.value.every(i => i.formValues.chainId == chainId.value)

    if (!isSameNetwork)
      throw new Error('Can\'t add transaction from different network')

    const tx = await parseTransactionObject(values as BatchFormValues, mode.value)

    console.log({ tx })

    const newVal = {
      formValues: values as BatchFormValues,
    }

    if (editMode.value) {
      batch.value[batchIndex.value] = newVal
      batchIndex.value = undefined
      notify({
        type: 'success',
        message: 'Transaction Updated Successfully',
      })
    }
    else {
      batch.value.push(newVal)

      notify({
        type: 'success',
        message: 'Transaction Added Successfully',
      })
    }
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
  const isChainSupported = abiFetcherNetworks.some(i => i.chainId === chainId.value)

  if (!contractAddress.value
    || !isChainSupported
    || !isAddress(contractAddress.value)
    || uploading.value
    || editMode.value)
    return

  try {
    pending.value = true

    setMethod({ value: '' })

    const fetcher = new AbiFetcher()

    const contractNetworks = await getContractNetworks(contractAddress.value)

    if (contractNetworks.length) {
      deployedNetworks.value = contractNetworks
      chainId.value = contractNetworks[0].chainId
    }

    const network = availableNetworks.find(i => i.chainId == chainId.value)

    if (!network)
      throw new Error('Invalid network')

    const resp = await fetcher.get(contractAddress.value, formatNetworkName(network.name))

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

function getMethodInputs(_builder: any, _method: string) {
  if (!_builder || _method === fallbackMethod)
    return []

  return _builder.getMethodInputs(_method)
}

watch(method, (_, oldMethod) => {
  if (oldMethod) {
    const inputMethods = getMethodInputs(builder.value, oldMethod)

    cleanupFormValues(inputMethods)
  }
})

watch(mode, async (newMode, oldMode) => {
  validateMethod()

  if (!builder.value || !method.value)
    return

  if (newMode === 'raw') {
    const tx = await parseTransactionObject(values as BatchFormValues, oldMode)

    setFieldValue('raw', tx.data, false)

    return
  }

  const inputMethods = getMethodInputs(builder.value, method.value)

  if (!meta.value.valid) {
    cleanupFormValues(inputMethods)
    return
  }

  const isCollapseToExpand = newMode === 'expand'
  const isExpandToCollapse = newMode === 'collapse'

  const isSuperCollapse = newMode === 'super-collapse'
  const wasSuperCollapse = oldMode === 'super-collapse'

  if (isSuperCollapse) {
    const actualValues = inputMethods.map((i: any) => {
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

  inputMethods.forEach((i: any) => {
    if (!i.name)
      throw new Error('Invalid input')

    const actualValues = wasSuperCollapse && values.params ? transformParams(values.params) : values

    const value = actualValues[i.name]

    setFieldValue(i.name, isCollapseToExpand ? tryJsonParse(value) : isExpandToCollapse ? tryJsonStringfy(value) : undefined, false)
  })
})
</script>

<template>
  <div class="relative flex flex-1 flex-col gap-5">
    <div class="flex gap-2 text-sm text-orange sm:hidden">
      <SvgoInfo2 class="mt-1.5 shrink-0" />
      Transaction builder is not supported on mobile devices
    </div>
    <ul class="flex w-fit flex-wrap justify-center rounded-5 bg-gray-850 p-1.5 text-sm font-medium sm:justify-normal sm:rounded-10">
      <li v-for="item in modes" :key="item.value">
        <button :class="mode === item.value ? 'bg-gray-900' : 'text-gray-400'" class="flex items-center gap-2.5 whitespace-nowrap rounded-2xl px-6 py-2.5 sm:rounded-7.5" @click="mode = item.value">
          {{ item.label }}
        </button>
      </li>
    </ul>
    <form @submit="onSubmit">
      <div class="flex flex-col rounded-[25px] bg-gray-850 py-7.5">
        <div class="grid w-full max-w-full grid-cols-1 gap-10 px-7.5 sm:grid-cols-3">
          <div class="flex w-full flex-col gap-7.5 sm:col-span-2">
            <div class="input-wrapper">
              <label class="input-label" for="input-contractAddress">Contract Address</label>
              <CommonInput v-model="contractAddress" class="flex-1" :error-message="contractAddressError" name="contractAddress" placeholder="Enter Address">
                <template #suffix>
                  <SvgSpinner v-if="pending" />
                </template>
              </CommonInput>
            </div>

            <div class="input-wrapper">
              <label class="w-[180px] shrink-0 text-sm font-medium text-gray-400" for="input-contractAddress">Network</label>
              <CommonSelect
                v-model="chainId"
                class="w-full"
                value-key="chainId"
                label-key="name"
                icon-key="icon"
                :options="deployedNetworks"
              >
                <template #button-prefix>
                  <ChainLogo class="h-6 w-6" :chain="chainId" />
                </template>
                <template #item-prefix="{ value }">
                  <ChainLogo class="h-6 w-6" :chain="value" />
                </template>
              </CommonSelect>
            </div>

            <div class="input-wrapper">
              <label class="input-label shrink-0" for="input-abi">Enter ABI</label>
              <CommonTextarea id="input-abi" v-model="ABI" :error-message="abiErrorMessage" rows="5" name="abi" placeholder="ABI []" />
            </div>

            <div class="input-wrapper">
              <label class="input-label shrink-0" for="input-toAddress">To Address</label>
              <CommonInput v-model="toAddress" class="w-full" :error-message="toAddressError" name="toAddress" placeholder="Enter Address" />
            </div>

            <div class="input-wrapper">
              <label class="input-label shrink-0" for="input-value">ETH Value</label>
              <CommonInput v-model="ethValue" class="w-full" :error-message="ethValueError" name="value" placeholder="uint" />
            </div>

            <div v-if="builder && mode !== 'raw'" class="input-wrapper">
              <label class="input-label shrink-0">Method</label>
              <CommonSelect
                v-model="method"
                searchable
                class="w-full"
                :options="methods"
              />
            </div>
          </div>
          <div
            v-if="!batch?.length"
            class="flex h-[360px] flex-col items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-primary bg-primary bg-opacity-10 p-10 font-medium"
            @dragenter="dragender"
            @dragleave="dragleave"
            @dragover="dragover"
            @drop="drop"
          >
            <SvgoFilePlus class="pointer-events-none text-primary" />
            <span v-if="isDragging" class="pointer-events-none">
              Drop a JSON file here
            </span>
            <template v-else>
              <h2 class="pointer-events-none text-sm">
                Batching
              </h2>
              <p class="text-center text-xs leading-5">
                <span class="pointer-events-none"> Drag and drop a JSON file or</span>
                <br>
                <input
                  id="json-file"
                  ref="file"
                  type="file"
                  class="absolute h-px w-px overflow-hidden opacity-0"
                  accept="application/JSON"
                  @change="handleFileUpload"
                >
                <label for="json-file" class="cursor-pointer text-primary">
                  Choose a file
                </label>
              </p>
            </template>
          </div>

          <div v-else class="flex h-fit min-w-[300px] shrink-0 flex-col rounded-[14px] bg-gray-975 p-5">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="text-sm">
                Transactions Batch
              </h2>
              <button v-tippy="'Download'" class="flex flex-col items-center" type="button" @click="downloadJson">
                <SvgoDownload class="h-5 w-5" />
              </button>
            </div>

            <SlickList v-model:list="batch" use-drag-handle class="scroll-style flex max-h-[450px] flex-col gap-5 overflow-auto" tag="ul" axis="y">
              <BatchItem v-for="(item, i) in batch" :key="item.formValues.method + i" :item="item" :index="i" @edit-batch="handleEditBatchItem" @delete-batch="handleDeleteBatchItem" />
            </SlickList>

            <div class="ml-7.5 mt-5">
              <CommonButton size="sm" @click="handleCreateBatchModal">
                Execute Batch
              </CommonButton>
            </div>
          </div>
        </div>

        <hr class="my-7.5 border-gray-800">

        <div class="flex flex-col gap-5">
          <div v-if="mode === 'raw'" class="flex w-full max-w-[820px] gap-7.5 px-7.5">
            <label class="w-[180px] shrink-0 text-sm font-medium text-gray-400">Data</label>
            <CommonTextarea v-model="rawDataValue" :error-message="rawDataErrorMessage" name="raw" rows="5" placeholder="Enter raw data" />
          </div>

          <template v-else-if="builder && method">
            <BuilderParamsInput v-if="mode === 'super-collapse'" :builder="builder" :method="method" />

            <BuilderInput
              v-for="input in methodInputs"
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
      <CommonButton :disabled="!meta.valid" type="submit" class="mx-7.5 mt-8 w-fit">
        {{ editMode ? "Edit" : 'Add' }} Transaction
      </CommonButton>
    </form>
  </div>
</template>

<style scoped>
.input-label {
  @apply text-sm font-medium text-gray-400 sm:w-[180px]
}

.input-wrapper {
  @apply flex sm:flex-row flex-col sm:items-center w-full gap-4 sm:gap-7.5
}
</style>
