<script lang="ts" setup>
import { TransactionBuilder } from '@instadapp/transaction-builder'

const chainId = ref(137)
const abi = ref('[{"inputs":[{"internalType":"address","name":"addr1","type":"address"}],"name":"typeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"addr1Array","type":"address[]"}],"name":"typeArrayAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool[]","name":"bool1Array","type":"bool[]"}],"name":"typeArrayBoolean","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"bytesTypeArray","type":"bytes[]"}],"name":"typeArrayBytes","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"bytesType32Array","type":"bytes32[]"}],"name":"typeArrayBytes32","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4[]","name":"bytesType4Array","type":"bytes4[]"}],"name":"typeArrayBytes4","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int256[]","name":"num1Array","type":"int256[]"}],"name":"typeArrayInt256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common[]","name":"common","type":"tuple[]"}],"name":"typeArrayStuctCommon","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common","name":"common","type":"tuple"},{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.CommonNested[]","name":"commonNested","type":"tuple[]"}],"name":"typeArrayStuctCommonNested","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint256[]","name":"num2","type":"uint256[]"}],"internalType":"struct TxBuilder.Uint256Array[]","name":"uint256Array","type":"tuple[]"}],"name":"typeArrayStuctUint256Array","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"num1Array","type":"uint256[]"}],"name":"typeArrayUint256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8[]","name":"num1Array","type":"uint8[]"}],"name":"typeArrayUint8","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"bool1","type":"bool"}],"name":"typeBoolean","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"bytesType","type":"bytes"}],"name":"typeBytes","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"bytesType32","type":"bytes32"}],"name":"typeBytes32","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"bytesType4","type":"bytes4"}],"name":"typeBytes4","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"hash","type":"bytes32"}],"name":"typeCommon","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"address[]","name":"addr","type":"address[]"},{"internalType":"bool[]","name":"boolean","type":"bool[]"},{"internalType":"bytes32","name":"hash","type":"bytes32"}],"name":"typeCommonArray","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"int256","name":"num1","type":"int256"}],"name":"typeInt256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common","name":"common","type":"tuple"}],"name":"typeStuctCommon","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"int256","name":"num2","type":"int256"},{"internalType":"address","name":"addr","type":"address"},{"internalType":"bool","name":"boolean","type":"bool"},{"internalType":"bytes32","name":"bytes32Data","type":"bytes32"},{"internalType":"bytes4","name":"bytes4Data","type":"bytes4"},{"internalType":"bytes","name":"bytesData","type":"bytes"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.Common","name":"common","type":"tuple"},{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint8","name":"numUint8","type":"uint8"}],"internalType":"struct TxBuilder.CommonNested","name":"commonNested","type":"tuple"}],"name":"typeStuctCommonNested","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"components":[{"internalType":"uint256","name":"num1","type":"uint256"},{"internalType":"uint256[]","name":"num2","type":"uint256[]"}],"internalType":"struct TxBuilder.Uint256Array","name":"uint256Array","type":"tuple"}],"name":"typeStuctUint256Array","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"num1","type":"uint256"}],"name":"typeUint256","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"num1","type":"uint8"}],"name":"typeUint8","outputs":[],"stateMutability":"nonpayable","type":"function"}]')
const txBuilder = shallowRef<TransactionBuilder>()
const method = ref('typeCommon(uint256,address,bool,bytes32)')
const methods = computed(() => txBuilder.value?.getWriteMethods() || [])
const inputs = computed(() => method.value ? txBuilder.value?.getMethodInputs(method.value) || [] : [])
const inputsData = ref([])

watch(abi, () => {
  // method.value = ''
  inputsData.value = []
  if (!abi.value)
    return

  try {
    txBuilder.value = TransactionBuilder.create(JSON.parse(abi.value))
  }
  catch (e) {
    txBuilder.value = undefined
    console.error(e)
  }
}, { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <h1>Transaction Builder</h1>

    <hr class="border-slate-150 dark:border-slate-800">

    <div class="flex items-center gap-4 justify-between">
      <div class="space-y-3 flex-1">
        <label>Contract address</label>

        <CommonInput placeholder="Contract address" />
      </div>

      <div class="space-y-3">
        <span class="text-sm">Network</span>
        <CommonSelect v-model="chainId" value-key="chainId" label-key="name" icon-key="icon" :options="availableNetworks">
          <template #button-prefix>
            <ChainLogo class="w-6 h-6" :chain="chainId" />
          </template>
          <template #item-prefix="{ value }">
            <ChainLogo class="w-6 h-6" :chain="value" />
          </template>
        </CommonSelect>
      </div>
    </div>
    <div class="space-y-3">
      <label>ABI</label>
      <textarea
        v-model="abi" :rows="6"
        class="w-full dark:bg-slate-800 placeholder:text-sm placeholder:text-slate-400 text-sm font-medium rounded-[14px] bg-slate-100 py-[15px] px-4 border-0 outline-none focus:border-0 focus:outline-none focus:ring-0"
      />
    </div>

    <div v-if="txBuilder">
      <div class="space-y-3">
        <label>Method</label>

        <select
          v-model="method"
          class="w-full relative flex items-center focus-within:outline-none px-5 py-3.5 rounded-[15px] border-0 dark:bg-slate-800  bg-slate-100 focus-within:ring-1 dark:focus-within:bg-gray-850 focus-within:bg-slate-50 dark:focus-within:ring-slate-750 focus-within:ring-slate-100"
        >
          <option v-for="m in methods" :key="m" :value="m">
            {{ m }}
          </option>
        </select>
      </div>

      <hr class="border-slate-150 dark:border-slate-800 my-5">

      <div class="space-y-5">
        <TransactionBuilderInput
          v-for="(input, index) in inputs" :key="index" v-model="inputsData[index]"
          :method="method" :tx-builder="txBuilder" :input="input" :index="index" root
        />
      </div>
    </div>
  </div>
</template>
