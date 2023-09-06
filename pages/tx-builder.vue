<script setup lang="ts">
import { SlickItem, SlickList } from 'vue-slicksort'

import { TransactionBuilder } from '@instadapp/transaction-builder'
import { AbiFetcher } from '@instadapp/utils'
import { isAddress } from 'ethers/lib/utils'
import { useField, useForm } from 'vee-validate'
import { serialize } from 'error-serializer'

definePageMeta({
  middleware: 'auth',
})

useAccountTrack(undefined, () => {
  useEagerConnect()
})

const method = ref('typeCommonArray(uint256,address[],bool[],bytes32)')
const ABI = ref('[{"inputs":[{"internalType":"address","name":"addr1","type":"address"}],"name":"typeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"addr1Array","type":"address[]"}],"name":"typeArrayAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool[]","name":"bool1Array","type":"bool[]"}],"name":"typeArrayBoolean","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"bytesTypeArray","type":"bytes[]"}],"name":"typeArrayBytes","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"bytesType32Array","type":"bytes32[]"}],"name":"typeArrayBytes32","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4[]","name":"bytesType4Array","type":"bytes4[]"}],"name":"typeArrayBytes4","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int256[]","name":"num1Array","type":"int256[]"}],"name":"typeArrayInt256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common[]","name":"common","type":"tuple[]"}],"name":"typeArrayStuctCommon","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common","name":"common","type":"tuple"},{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.CommonNested[]","name":"commonNested","type":"tuple[]"}],"name":"typeArrayStuctCommonNested","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint256[]","name":"num2","type":"uint256[]"}],"internalType":"struct TxBuilder.Uint256Array[]","name":"uint256Array","type":"tuple[]"}],"name":"typeArrayStuctUint256Array","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"num1Array","type":"uint256[]"}],"name":"typeArrayUint256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8[]","name":"num1Array","type":"uint8[]"}],"name":"typeArrayUint8","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"bool1","type":"bool"}],"name":"typeBoolean","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"bytesType","type":"bytes"}],"name":"typeBytes","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"bytesType32","type":"bytes32"}],"name":"typeBytes32","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"bytesType4","type":"bytes4"}],"name":"typeBytes4","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"hash","type":"bytes32"}],"name":"typeCommon","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"address[]","name":"addr","type":"address[]"},{"internalType":"bool[]","name":"boolean","type":"bool[]"},{"internalType":"bytes32","name":"hash","type":"bytes32"}],"name":"typeCommonArray","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int256","name":"num1","type":"int256"}],"name":"typeInt256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common","name":"common","type":"tuple"}],"name":"typeStuctCommon","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common","name":"common","type":"tuple"},{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.CommonNested","name":"commonNested","type":"tuple"}],"name":"typeStuctCommonNested","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint256[]","name":"num2","type":"uint256[]"}],"internalType":"struct TxBuilder.Uint256Array","name":"uint256Array","type":"tuple"}],"name":"typeStuctUint256Array","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num1","type":"uint256"}],"name":"typeUint256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"num1","type":"uint8"}],"name":"typeUint8","outputs":[],"stateMutability":"nonpayable","type":"function"}]')
const pending = ref(false)

const transactions = ref<any>([])
const actualTransactions = computed(() => transactions.value.map((i: any) => i.tx))

const { sendTransactions } = useAvocadoSafe()

const modes: TxBuilderModes[] = ['expand', 'collapse', 'super-collapse']
const mode = ref<TxBuilderModes>('expand')

provide('mode', mode)

const builder = computed(() => isJsonString(ABI.value) ? new TransactionBuilder(JSON.parse(JSON.stringify(ABI.value))) : null)

const { handleSubmit, values, meta, setFieldValue, resetForm, handleReset, resetField, setFieldError } = useForm({
  keepValuesOnUnmount: true,
})

const contractAddress = ref('0xa039eee5d6f876be3859e3dfce00fb7ecccd65cb')

const contractErrorMessage = ref('')

const { value: toAddress, errorMessage: toAddressError } = useField<string>('toAddress', val => isAddress(val!), {
  initialValue: '0x9F60699cE23f1Ab86Ec3e095b477Ff79d4f409AD',
})
const { value: chainId } = useField<number>('chainId', val => !!val, {
  initialValue: 137,
})

const { data, pending: estimatePending, error } = useEstimatedFee(actualTransactions, chainId, {
  immediate: true,
})

function cleanupFormValues(methods: any[]) {
  handleReset()
  resetForm()

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

    console.log(args, method.value)

    const data = await builder.value.build(method.value, args)

    const tx = {
      data,
      value: 0,
      operation: 0,
      to: contractAddress.value,
    }

    const arr = [{
      tx,
      method: method.value,
    }]

    console.log({
      tx,
      whole: arr,
    })

    transactions.value = arr.concat(transactions.value)
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
  if (!isAddress(contractAddress.value)) {
    contractErrorMessage.value = 'Invalid address'
    return
  }

  try {
    pending.value = true

    ABI.value = ''
    method.value = ''

    const fetcher = new AbiFetcher()

    const selam = await fetcher.get(contractAddress.value, 'polygon')

    ABI.value = JSON.stringify(selam, null, 2)
    contractErrorMessage.value = ''
  }
  catch (e) {
    const parsed = serialize(e)

    contractErrorMessage.value = parsed.message
  }
  finally {
    pending.value = false
  }
}, {
  debounce: 1000,
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

async function handleSendTransaction() {
  const tx = await sendTransactions(actualTransactions.value, chainId.value, undefined, 'others')

  if (tx)
    showPendingTransactionModal(tx, chainId.value)
}
</script>

<template>
  <div class="flex-1 relative">
    <div class="grid grid-cols-2 gap-8">
      <div>
        <h1 class="mb-4 flex items-center gap-4">
          New Transaction
          <SvgSpinner v-if="pending" />
        </h1>

        <form class="flex flex-col gap-4" @submit="onSubmit">
          <div class="flex w-full gap-4">
            <CommonInput v-model="contractAddress" class="flex-1" :error-message="contractErrorMessage" name="contractAddress" placeholder="Enter Address" />

            <CommonSelect
              v-model="chainId"
              value-key="chainId"
              label-key="name"
              :options="availableNetworks"
            >
              <template #button-prefix>
                <ChainLogo class="w-6 h-6 shrink-0" :chain="chainId" />
              </template>
              <template #item-prefix="{ value }">
                <ChainLogo class="w-6 h-6 shrink-0" :chain="value" />
              </template>
            </CommonSelect>
          </div>

          <textarea v-model="ABI" rows="5" placeholder="Enter ABI" class="dark:bg-slate-800  bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100" />
          <div>
            <span>
              To address
            </span>
            <CommonInput v-model="toAddress" :error-message="toAddressError" name="toAddress" placeholder="Enter Address" />
          </div>

          <template v-if="builder">
            <label for="">Write Methods</label>
            <select v-model="method" class="dark:bg-slate-800  bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100">
              <option v-for="item in builder?.getWriteMethods()" :key="item">
                {{ item }}
              </option>
            </select>
          </template>

          <template v-if="builder && method">
            <BuilderParamsInput v-if="mode === 'super-collapse'" :builder="builder" :method="method" />

            <BuilderInput v-for="input in builder.getMethodInputs(method)" v-show="mode !== 'super-collapse'" :key="input.name" :name="input.name" :method="method" :builder="builder" :input="input" />
            <CommonButton :disabled="!meta.valid" type="submit" class="mt-8 w-fit">
              Add
            </CommonButton>
          </template>
        </form>
      </div>
      <div class="flex flex-col gap-4">
        <h1>
          Send Transaction
        </h1>

        <ul v-if="transactions.length" class="flex flex-col gap-4">
          <SlickList v-model:list="transactions" axis="y">
            <SlickItem v-for="(tx, i) in transactions" :key="tx.data" :index="i">
              {{ tx.method }}
            </SlickItem>
          </SlickList>
        </ul>

        <EstimatedFee :data="data" :loading="estimatePending" :error="error" />

        <CommonButton v-if="transactions.length" :disabled="estimatePending" class="max-w-fit" type="button" @click="handleSendTransaction">
          Send transaction
        </CommonButton>
        <fieldset name="mode">
          <template v-for="item in modes" :key="item">
            <input :id="item" v-model="mode" type="radio" :value="item">
            <label class="ml-2" :for="item"> {{ item }}</label><br>
          </template>
        </fieldset>
      </div>
    </div>
  </div>
</template>
