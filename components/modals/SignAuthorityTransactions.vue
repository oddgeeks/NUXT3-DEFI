<script setup lang="ts">
import { wait } from '@instadapp/utils'

interface ITxHash {
  hash: string
  chainId: number
}

const props = defineProps<{
  transactions: IAuthorityTx[]
  authority: IAuthority
  remove: boolean
}>()

const { parseTransactionError } = useErrorHandler()
const { sendTransaction } = useAvocadoSafe()
const { setSelectedSafe } = useSafe()
const { account } = useWeb3()

const txHashes = ref<ITxHash[]>([])
const pending = ref(false)
const errors = ref<string[]>([])
const finished = computed(() => txHashes.value.length === props.transactions.length)

const action = computed(() => props.remove ? 'remove-auth' : 'add-auth')
async function refreshSafe() {
  setTimeout(() => {
    setSelectedSafe()
  }, 7000)
}
async function sendTransactions() {
  pending.value = true
  errors.value = []
  txHashes.value = []
  for (const tx of props.transactions) {
    try {
      const provider = getRpcProvider(tx.chainId)

      const metadata = encodeAuthMetadata({
        address: props.authority.address,
        chainId: tx.chainId,
        remove: props.remove,
      })

      const hash = await sendTransaction(tx, {
        metadata,
      })

      if (!hash) {
        errors.value.push(`${chainIdToName(tx.chainId)}: Transaction hash not found`)
        continue
      }

      await wait(1000)

      console.log({ hash })

      const transaction = await provider.getTransaction(hash)

      if (!transaction) {
        errors.value.push(`${chainIdToName(tx.chainId)}: Transaction not found`)
        continue
      }

      transaction.wait().then(() => {
        txHashes.value.push({
          hash,
          chainId: tx.chainId,
        })
      })

      const accountLink = `<https://avocado.instadapp.io/?user=${props.authority.address}|${shortenHash(
        props.authority.address,
        12,
      )}>`

      logActionToSlack({
        message: `${accountLink}`,
        action: action.value,
        account: account.value,
        txHash: hash,
        chainId: String(tx.chainId),
      })
    }
    catch (e: any) {
      const err = parseTransactionError(e)
      openSnackbar({
        message: err.formatted,
        type: 'error',
      })

      errors.value.push(`${chainIdToName(tx.chainId)}: ${err.formatted}`)

      logActionToSlack({
        message: err.formatted,
        type: 'error',
        action: action.value,
        account: account.value,
        errorDetails: err.parsed,
      })
    }
    finally {
      pending.value = false
    }
  }
}

whenever(finished, () => {
  refreshSafe()
})

onMounted(() => sendTransactions())

onBeforeUnmount(() => {
  if (finished.value)
    refreshSafe()
})
</script>

<template>
  <div>
    <div class="flex flex-col justify-center items-center gap-5">
      <AuthorityAvatar
        :address="authority.address"
        class="-mr-2"
      />
      <div class="dark:bg-gray-850 bg-slate-50 rounded-5 px-2.5 py-2 text-slate-400 flex items-center text-xs">
        {{ shortenHash(authority.address) }}
      </div>
      <template v-if="errors.length">
        <h1>
          Error
        </h1>
        <ul class="flex flex-col gap-2">
          <li v-for="error in errors" :key="error" class="text-xs text-slate-400">
            {{ error }}
          </li>
        </ul>
        <CommonButton @click="sendTransactions">
          Try Again
        </CommonButton>
      </template>
      <template v-else-if="finished">
        <h1>
          Changes Saved
        </h1>
        <SvgoCheckCircle
          class="w-10 h-10 success-circle"
        />
      </template>
      <template v-else>
        <h1>
          Saving Changes
        </h1>
        <p class="mt-2.5 text-slate-400 text-xs leading-5 font-medium">
          {{ txHashes.length }}/{{ transactions.length }} chains {{ remove ? 'Removed' : 'Added' }}
        </p>
        <SvgSpinner class="text-primary !w-10 !h-10" />
        <p class="font-medium text-xs leaidng-5 text-center text-slate-400">
          Do not close this page till the process is completed
        </p>
      </template>
    </div>
  </div>
</template>
