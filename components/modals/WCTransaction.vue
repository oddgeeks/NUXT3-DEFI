<script lang="ts" setup>
import type { SessionTypes } from '@walletconnect/types'
import { storeToRefs } from 'pinia'
import { Erc20__factory } from '@/contracts'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg?component'
import NetworkSVG from '~/assets/images/icons/network.svg?component'
import FlowersSVG from '~/assets/images/icons/flowers.svg?component'
import SVGClockCircle from '~/assets/images/icons/clock-circle.svg?component'

const props = defineProps<{
  payload: any
  chainId: string
  sessionV2: SessionTypes.Struct
  metadata: string
  isSign?: boolean
  signMessageDetails?: any
  bookmark?: IBookmark
}>()

const emit = defineEmits(['resolve', 'reject'])

const { sendTransactions, safeAddress, getActualId } = useAvocadoSafe()
const { account } = useWeb3()
const [submitting, toggle] = useToggle()
const { parseTransactionError } = useErrorHandler()
const { web3WalletV2 } = storeToRefs(useWalletConnectV2())
const { tokens } = storeToRefs(useTokens())
const { getRpcProviderByChainId } = useShared()

const { authorisedNetworks } = useAuthorities()

const nonAuthorised = computed(() => {
  return !authorisedNetworks.value?.find(i => String(i.chainId) == String(props.chainId))
})

const submitDisabled = computed(
  () => submitting.value || pending.value || !!error.value || nonAuthorised.value,
)

const revokeTokens = computed(() => {
  const revokeTokens = simulationDetails.value?.simulation?.revokeTokens

  if (!revokeTokens)
    return []

  return revokeTokens.map((i) => {
    const token = tokens.value?.find(j => j.chainId == props.chainId && isAddressEqual(j.address, i.token))

    return {
      ...i,
      tokenObj: token,
    }
  })
})

const reactiveBookmark = ref(props.bookmark)

const peerURL = computed(() => {
  return props.sessionV2?.peer?.metadata?.url
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
  if (props.sessionV2 && web3WalletV2.value) {
    web3WalletV2.value.respondSessionRequest({
      topic: props.sessionV2.topic,
      response: {
        id: props.payload.id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: message || 'User rejected.',
        },
      },
    })
  }
}

function calculateDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString()
}

function getDefaultTransactions() {
  const [transactionOrTransactions] = props.payload.params

  return Array.isArray(transactionOrTransactions)
    ? transactionOrTransactions
    : [transactionOrTransactions]
}

const transactions = ref(getDefaultTransactions())

const options = computed(() => {
  const [_, __, options] = props.payload.params

  return options || {}
})

const {
  data: fee,
  pending,
  error,
  refresh,
} = useEstimatedFee(transactions, ref(props.chainId), {
  immediate: true,
  options: options.value,
})

async function handleSubmit() {
  try {
    toggle(true)
    const id = getActualId(transactions.value, options.value?.id)

    const transactionHash = await sendTransactions(
      transactions.value,
      props.chainId,
      {
        metadata: props.metadata,
        ...options.value,
        id,
      },
      'wc',
    )

    if (!transactionHash && web3WalletV2.value) {
      let fakeHash = availableNetworks.find(i => String(i.chainId) == String(props.chainId))?.fakeTransactionHash

      fakeHash = `${fakeHash?.slice(0, -1)}3`

      web3WalletV2.value.respondSessionRequest({
        topic: props.sessionV2.topic,
        response: {
          id: props.payload.id,
          result: fakeHash,
          jsonrpc: '2.0',
        },
      })
      toggle(false)
      return
    }

    if (props.sessionV2 && web3WalletV2.value) {
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
      message: generateSlackMessage(props.metadata, props.chainId),
      type: 'success',
      action: 'dapp',
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
      action: 'dapp',
      chainId: props.chainId,
      account: account.value,
      errorDetails: err.parsed,
    })
  }
  finally {
    toggle(false)
  }
}

const { data: simulationDetails, error: simulationError, refresh: refreshSimulation } = useAsyncData(
  'simulationDetails',
  () => {
    if (networksSimulationNotSupported.includes(Number(props.chainId)))
      throw new Error('Simulation not supported on this network.')

    const id = getActualId(transactions.value, options.value?.id)

    return http('/api/simulate', {
      method: 'POST',
      body: {
        actions: transactions.value.map((i) => {
          return {
            target: i.to,
            data: i.data,
            value: i?.value || '0',
            operation: i?.operation ? String(i?.operation) : '0',
          }
        }),
        avocadoSafe: safeAddress.value,
        chainId: props.chainId,
        id,
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
  return Object.values(simulationDetails.value.simulation).some(
    (i: any) => i?.length > 0,
  )
})

function formatURL(url: string) {
  try {
    return new URL(url).hostname
  }
  catch {
    return null
  }
}

function handleReject() {
  rejectRequest('Rejected')
  emit('reject')
}

async function handleCreateBookmark() {
  const { success, payload } = await openCreateBookmarkModal({
    chainId: props.chainId,
    payload: props.payload,
    session: props.sessionV2,
    metadata: props.metadata,
    type: 'wc',
  })

  if (success && payload) {
    console.log(payload)
    reactiveBookmark.value = payload
  }
}

async function handleUpdateBookmark() {
  const { success, payload } = await openCreateBookmarkModal({
    ...props.bookmark,
    edit: true,
  })

  if (success)
    reactiveBookmark.value = payload
}

async function addRevokeTransaction(tokenAddres: string, address: string) {
  const erc20 = Erc20__factory.connect(
    tokenAddres,
    getRpcProviderByChainId(props.chainId),
  )

  const { data } = await erc20.populateTransaction.approve(address, '0')

  const tx = {
    to: tokenAddres,
    data,
    value: '0',
    operation: '0',
  }

  transactions.value.push(tx)

  refresh()
  refreshSimulation()
}

onUnmounted(() => {
  clearNuxtData('simulationDetails')
})
</script>

<template>
  <form class="flex flex-col gap-7.5 py-6 sm:pb-10 sm:pt-[34px]" @submit.prevent="handleSubmit">
    <div class="flex flex-col gap-7.5 px-6 sm:px-10">
      <audio v-if="!bookmark" src="/audio/alert.mp3" autoplay />
      <div class="text-center font-semibold leading-[30px] sm:text-left">
        <span v-if="isSign">Send Transaction: Permit2 Approval</span>
        <span v-else>Send Transaction</span>
      </div>
      <div class="flex flex-col gap-2.5">
        <div
          class="flex flex-col gap-4 rounded-5 bg-slate-50 px-5 py-[14px] dark:bg-gray-850"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-slate-400">
              <FlowersSVG />
              <span class="text-xs font-medium leading-5">App Name</span>
            </div>

            <div class="flex items-center gap-2.5">
              <a
                rel="noopener noreferrer"
                target="_blank"
                class="text-sm text-primary"
                :href="peerURL"
              >
                {{ formatURL(peerURL!) || sessionV2?.peer.metadata.name }}
              </a>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5 text-slate-400">
              <NetworkSVG />
              <span class="text-xs font-medium leading-5">Network</span>
            </div>

            <div class="flex items-center gap-2.5">
              <span class="text-xs font-medium">
                {{ chainIdToName(chainId) }}
              </span>
              <ChainLogo class="h-[18px] w-[18px]" :chain="chainId" />
            </div>
          </div>
          <EstimatedFee
            wrapper-class="!p-0"
            :loading="pending"
            :data="fee"
            :error="error"
          />

          <template v-if="isSign && signMessageDetails">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5 text-slate-400">
                <SVGClockCircle class="w-4" />
                <span class="text-xs font-medium leading-5">Exprires at</span>
              </div>

              <div class="flex items-center gap-2.5 text-sm">
                {{ calculateDate(signMessageDetails.expiration) }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <div v-if="revokeTokens?.length" class="flex flex-col border-y border-slate-150 px-6 dark:border-slate-800 sm:px-10">
      <details class="group text-xs">
        <summary class="flex cursor-pointer items-center justify-between py-5 text-primary">
          <span class="flex items-center gap-2">
            Revoke Tokens
            <SvgoInfo2 v-tippy="'Revoke tokens approvals of this transaction'" />
          </span>

          <SvgoChevronDown
            class="w-4 group-open:rotate-180"
          />
        </summary>

        <div class="group-open:pb-5">
          <ul class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <li v-for="i in revokeTokens" :key="i.from" class="flex justify-between rounded-2xl border px-2.5 py-2 text-[10px] dark:border-slate-800">
              <div class="flex items-center gap-2 font-medium">
                <SafeTokenLogo class="h-4 w-4" :url="i.tokenObj?.logoURI" />
                {{ shortenHash(i.to) }}
              </div>
              <div class="flex items-center gap-2.5">
                <button :disabled="pending" type="button" class="flex items-center gap-1.5 text-primary disabled:text-slate-500" @click="addRevokeTransaction(i.token, i.to)">
                  <SvgoPlus class="h-2.5 w-2.5" />
                  Revoke tx
                </button>
              </div>
            </li>
          </ul>
        </div>
      </details>
    </div>

    <div class="flex flex-col gap-7.5 px-6 sm:px-10">
      <SimulationDetails
        v-if="simulationDetails && hasSimulationDetails"
        :chain-id="chainId"
        :details="simulationDetails"
        :has-error="!!error"
      />
      <p v-if="simulationError" class="flex items-center gap-2 text-xs leading-5 text-orange-400">
        <SVGInfoCircle class="w-3" />

        {{ simulationError.message }}
      </p>
      <p v-if="nonAuthorised" class="flex gap-2 text-xs leading-5 text-orange-400">
        <SvgoExclamationCircle class="mt-1 w-3 shrink-0" />
        You are not authorised to sign transactions on {{ chainIdToName(chainId) }} network.
      </p>
      <div class="flex items-center justify-between gap-4">
        <CommonButton
          color="white"
          size="lg"
          class="flex-1 items-center justify-center hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
          @click="handleReject"
        >
          Reject
        </CommonButton>

        <CommonButton
          :loading="submitting"
          :disabled="submitDisabled"
          type="submit"
          class="flex-1 items-center justify-center"
          size="lg"
        >
          Submit
        </CommonButton>
      </div>
      <ManageBookmark :bookmark="reactiveBookmark" @update-bookmark="handleUpdateBookmark" @create-bookmark="handleCreateBookmark" />
    </div>
    <SessionLocked class="mx-auto" />
  </form>
</template>
