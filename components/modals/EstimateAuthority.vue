<script lang="ts" setup>
import { AvoSafeImplementation__factory } from '~~/contracts'

const props = defineProps<{
  authority: IAuthority
  chainIds: number[]
  remove?: boolean
}>()

const emit = defineEmits(['destroy'])

const { safeAddress, signer } = useAvocadoSafe()

const transactions = ref<IAuthorityTx[]>([])
const chainFees = ref<ChainFees>({})
const chainFeeErrors = ref<ChainFeeErrors>({})

const disabled = computed(() => {
  return !transactions.value.length || Object.keys(chainFees.value).length !== transactions.value.length || Object.keys(chainFeeErrors.value).length
})

async function prepareTransactions() {
  const txs: IAuthorityTx[] = []

  for (const chainId of props.chainIds) {
    const instance = AvoSafeImplementation__factory.connect(safeAddress.value, signer.value!)
    const functionName = props.remove ? 'removeAuthorities' : 'addAuthorities'

    const resp = await instance.populateTransaction[functionName]([props.authority.address])

    const tx = {
      to: safeAddress.value,
      data: resp.data,
      value: '0',
      operation: '0',
      chainId: Number(chainId),
    } as IAuthorityTx

    txs.push(tx)
  }

  transactions.value = txs

  return txs
}

const fees = computed(() => {
  const fees = Object.values(chainFees.value)
  const mergedFees = calculateMultipleEstimatedFee(...fees)
  return mergedFees
})

const formattedError = computed(() => {
  return [...new Set(Object.values(chainFeeErrors.value))].join('\n')
})

function handleBack() {
  emit('destroy')

  openManageAuthorityModal(props.authority, props.chainIds)
}

function handleContinue() {
  emit('destroy')

  openSignAuthorityModal(props.authority, transactions.value, props.remove)
}

onMounted(() => {
  prepareTransactions()
})
</script>

<template>
  <div class="flex flex-col gap-7.5">
    <h1 class="text-lg text-center">
      Estimated Gas Required
    </h1>
    <div>
      <ul class="flex flex-col gap-5 dark:bg-gray-850 bg-slate-50 py-4 px-5 rounded-5">
        <AuthorityEstimatedFeeItem v-for="tx in transactions" :key="tx.chainId" v-model:errors="chainFeeErrors" v-model="chainFees" :tx="tx" />
      </ul>
    </div>

    <EstimatedFee :error="formattedError" :data="fees" />
    <div class="flex gap-4">
      <CommonButton size="lg" class="w-full justify-center" @click="handleBack">
        Back
      </CommonButton>
      <CommonButton :disabled="disabled" size="lg" class="w-full justify-center" @click="handleContinue">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
