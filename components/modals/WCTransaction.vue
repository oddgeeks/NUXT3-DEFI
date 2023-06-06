<script lang="ts" setup>
import type WalletConnect from '@walletconnect/client'
import type { SessionTypes } from '@walletconnect/types'
import { storeToRefs } from 'pinia'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg?component'
import NetworkSVG from '~/assets/images/icons/network.svg?component'
import FlowersSVG from '~/assets/images/icons/flowers.svg?component'
import SVGClockCircle from '~/assets/images/icons/clock-circle.svg?component'

const props = defineProps<{
  payload: any
  chainId: string
  session?: WalletConnect
  sessionV2?: SessionTypes.Struct
  metadata: string
  isSign?: boolean
  signMessageDetails?: any
}>()

const emit = defineEmits(['resolve', 'reject'])

const { sendTransactions, safeAddress } = useAvocadoSafe()
const { account } = useWeb3()
const [submitting, toggle] = useToggle()
const { parseTransactionError } = useErrorHandler()
const { web3WalletV2 } = storeToRefs(useWalletConnectV2())

const submitDisabled = computed(
  () => submitting.value || pending.value || !!error.value,
)

const networksSimulationNotSupported = [1313161554]

const peerURL = computed(() => {
  return props.session ? props.session.peerMeta?.url : props.sessionV2?.peer?.metadata?.url
})

onMounted(async () => {
  document.title = '(1) Avocado'

  injectFavicon('/icons/favicon-alert.ico')
})

onBeforeUnmount(() => {
  document.title = 'Avocado'

  injectFavicon('/icons/favicon.ico')
})

function rejectRequest(message: string) {
  if (props.session) {
    props.session.rejectRequest({
      id: props.payload.id,
      error: {
        code: -32603,
        message,
      },
    })
  }
  else if (props.sessionV2 && web3WalletV2.value) {
    web3WalletV2.value.respondSessionRequest({
      topic: props.sessionV2.topic,
      response: {
        id: props.payload.id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: 'User rejected.',
        },
      },
    })
  }
}

function calculateDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString()
}

const transactions = computed(() => {
  const [transactionOrTransactions] = props.payload.params

  return Array.isArray(transactionOrTransactions)
    ? transactionOrTransactions
    : [transactionOrTransactions]
})

const options = computed(() => {
  const [transactionOrTransactions, chainId, options] = props.payload.params

  return options || {}
})

const {
  data: fee,
  pending,
  error,
} = useEstimatedFee(transactions, ref(props.chainId), {
  immediate: true,
  options: options.value,
})

async function handleSubmit() {
  try {
    toggle(true)

    const transactionHash = await sendTransactions(
      transactions.value,
      props.chainId,
      {
        metadata: props.metadata,
        ...options.value,
      },
    )
    if (!transactionHash) {
      // tracking mode
      toggle(false)
      return
    }

    console.log(props.session)

    if (props.session) {
      props.session.approveRequest({
        id: props.payload.id,
        result: transactionHash,
      })
    }
    else if (props.sessionV2 && web3WalletV2.value) {
      web3WalletV2.value.respondSessionRequest({
        topic: props.sessionV2.topic,
        response: {
          id: props.payload.id,
          result: transactionHash,
          jsonrpc: '2.0',
        },
      })
    }

    logActionToSlack({
      message: `${props.isSign ? 'Permit2 Approval' : 'Txn'} on ${
       peerURL.value
      }`,
      type: 'success',
      action: 'wc',
      txHash: transactionHash,
      chainId: props.chainId,
      account: account.value,
    })

    emit('resolve', true)

    showPendingTransactionModal(transactionHash, props.chainId, 'wc')
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: `${props.isSign ? 'Permit2 Approval' : 'Txn'} ${
        peerURL.value
      } ${err.formatted}`,
      type: 'error',
      action: 'wc',
      chainId: props.chainId,
      account: account.value,
      errorDetails: err.parsed,
    })
  }
  finally {
    toggle(false)
  }
}

const { data: simulationDetails, error: simulationError } = useAsyncData(
  'simulationDetails',
  () => {
    if (networksSimulationNotSupported.includes(Number(props.chainId)))
      throw new Error('Simulation not supported on this network.')

    return http('/api/simulate', {
      method: 'POST',
      body: {
        actions: transactions.value.map((i) => {
          console.log(i)
          return {
            target: i.to,
            data: i.data,
            value: i?.value || '0',
            operation: i?.operation ? String(i?.operation) : '0',
          }
        }),
        avocadoSafe: safeAddress.value,
        chainId: props.chainId,
        id: options.value?.id,
      },
    }) as Promise<ISimulation>
  },
  {
    immediate: true,
    server: false,
  },
)

const hasSimulationDetails = computed(() => {
  if (!simulationDetails.value)
    return false
  return Object.values(simulationDetails.value.balanceChange).some(
    (i: any[]) => i?.length > 0,
  )
})

function formatURL(url: string) {
  return new URL(url).hostname
}

function handleReject() {
  rejectRequest('Rejected')
  emit('reject')
}

onUnmounted(() => {
  clearNuxtData('simulationDetails')
})
</script>

<template>
  <form class="flex flex-col gap-7.5" @submit.prevent="handleSubmit">
    <audio src="/audio/alert.mp3" autoplay />
    <div class="font-semibold leading-[30px] text-center sm:text-left">
      <span v-if="isSign">Send Transaction: Permit2 Approval</span>
      <span v-else>Send Transaction</span>
    </div>
    <div class="flex flex-col gap-2.5">
      <div
        class="dark:bg-gray-850 bg-slate-50 flex flex-col gap-4 rounded-5 py-[14px] px-5"
      >
        <div class="flex justify-between items-center">
          <div class="text-slate-400 flex items-center gap-2.5">
            <FlowersSVG />
            <span class="text-xs leading-5 font-medium">App Name</span>
          </div>

          <div class="flex items-center gap-2.5">
            <a
              rel="noopener noreferrer"
              target="_blank"
              class="text-primary text-sm"
              :href="peerURL"
            >
              {{ formatURL(peerURL!) }}
            </a>
          </div>
        </div>
        <div class="flex justify-between items-center">
          <div class="text-slate-400 flex items-center gap-2.5">
            <NetworkSVG />
            <span class="text-xs leading-5 font-medium">Network</span>
          </div>

          <div class="flex items-center gap-2.5">
            <span class="text-xs font-medium">
              {{ chainIdToName(chainId) }}
            </span>
            <ChainLogo class="w-[18px] h-[18px]" :chain="chainId" />
          </div>
        </div>
        <EstimatedFee
          wrapper-class="!p-0"
          :loading="pending"
          :data="fee"
          :error="error"
        />

        <template v-if="isSign && signMessageDetails">
          <div class="flex justify-between items-center">
            <div class="text-slate-400 flex items-center gap-2.5">
              <SVGClockCircle class="w-4" />
              <span class="text-xs leading-5 font-medium">Exprires at</span>
            </div>

            <div class="flex items-center gap-2.5 text-sm">
              {{ calculateDate(signMessageDetails.expiration) }}
            </div>
          </div>
        </template>
      </div>
    </div>
    <SimulationDetails
      v-if="hasSimulationDetails"
      :chain-id="chainId"
      :details="simulationDetails"
      :has-error="!!error"
    />
    <p v-if="simulationError" class="text-xs leading-5 text-orange-400 flex items-center gap-2">
      <SVGInfoCircle class="w-3" />

      {{ simulationError.message }}
    </p>
    <div class="flex justify-between items-center gap-4">
      <CommonButton
        color="white"
        size="lg"
        class="flex-1 justify-center items-center hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
        @click="handleReject"
      >
        Reject
      </CommonButton>

      <CommonButton
        :loading="submitting"
        :disabled="submitDisabled"
        type="submit"
        class="flex-1 justify-center items-center"
        size="lg"
      >
        Submit
      </CommonButton>
    </div>
  </form>
</template>
