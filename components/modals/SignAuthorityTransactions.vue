<script setup lang="ts">
interface ITxHash {
  hash: string
  chainId: number
}

const props = defineProps<{
  transactions: IAuthorityTx[]
  authority: IAuthority
}>()

const { parseTransactionError } = useErrorHandler()
const { account } = useWeb3()
const { sendTransaction } = useAvocadoSafe()
const txHashes = ref<ITxHash[]>([])
const pending = ref(false)
const error = ref()
const finished = computed(() => txHashes.value.length === props.transactions.length)

async function sendTransactions() {
  try {
    pending.value = true
    error.value = undefined
    txHashes.value = []
    for (const tx of props.transactions) {
      const hash = await sendTransaction(tx)

      if (!hash)
        return

      txHashes.value.push({
        hash,
        chainId: tx.chainId,
      })
    }
  }
  catch (e: any) {
    const err = parseTransactionError(e)
    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    error.value = err

    // logActionToSlack({
    //   message: err.formatted,
    //   type: 'error',
    //   action: 'bridge',
    //   account: account.value,
    //   errorDetails: err.parsed,
    // })
  }
  finally {
    pending.value = false
  }
}

onMounted(() => sendTransactions())
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
      <h1>
        Saving Changes
      </h1>
      <p class="mt-2.5 text-slate-400 text-xs leading-5 font-medium">
        {{ txHashes.length }} /{{ transactions.length }} chains Added
      </p>
      <SvgSpinner class="text-primary !w-10 !h-10" />
      <p class="font-medium text-xs leaidng-5 text-center text-slate-400">
        Do not close this page till the process is completed
      </p>
    </div>
  </div>
</template>
