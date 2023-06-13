<script setup lang="ts">
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
const { setSafe } = useAuthorities()

const txHashes = ref<ITxHash[]>([])
const pending = ref(false)
const error = ref()
const finished = computed(() => txHashes.value.length === props.transactions.length)

async function refreshSafe() {
  setTimeout(() => {
    setSafe()
  }, 7000)
}

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

    refreshSafe()
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
      <template v-if="error">
        <h1>
          Error Occured
        </h1>
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
          {{ txHashes.length }} /{{ transactions.length }} chains {{ remove ? 'Removed' : 'Added' }}
        </p>
        <SvgSpinner class="text-primary !w-10 !h-10" />
        <p class="font-medium text-xs leaidng-5 text-center text-slate-400">
          Do not close this page till the process is completed
        </p>
      </template>
    </div>
  </div>
</template>
