<script setup lang="ts">
import { utils } from 'ethers'
import {
  AvoFactoryProxy__factory,
  Forwarder__factory,
  GaslessWallet__factory,
  MultisigForwarder__factory,
} from '@/contracts'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'

const props = defineProps<{
  options: ISafeOptions
}>()

const emit = defineEmits(['destroy'])

const { safeAddress, sendTransaction } = useAvocadoSafe()
const { isSafeMultisig } = storeToRefs(useMultisig())
const { forwarderProxyAddress } = useSafe()
const { parseTransactionError } = useErrorHandler()
const { getRpcProviderByChainId } = useShared()

const { account } = useWeb3()
const submitting = ref(false)

const avoWalletImpAddress = ref('')

async function fetchAvowalletImpl() {
  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    getRpcProviderByChainId(props.options.chainId),
  )

  const multisigForarderContract = MultisigForwarder__factory.connect(
    multisigForwarderProxyAddress,
    getRpcProviderByChainId(props.options.chainId),
  )

  const avoFactory = await forwarderProxyContract.avoFactory()

  const avoMultisigFactory = await multisigForarderContract.avoFactory()

  const avoFactoryProxyContract = AvoFactoryProxy__factory.connect(
    avoFactory,
    getRpcProviderByChainId(props.options.chainId),
  )

  const multisigAvoFactoryProxyContract = AvoFactoryProxy__factory.connect(
    avoMultisigFactory,
    getRpcProviderByChainId(props.options.chainId),
  )

  const avoWalletImpl = isSafeMultisig.value ? await multisigAvoFactoryProxyContract.avoWalletImpl() : await avoFactoryProxyContract.avoWalletImpl()

  console.log(avoWalletImpl, { isSafeMultisig: isSafeMultisig.value })

  avoWalletImpAddress.value = avoWalletImpl
  return avoWalletImpl
}

const { data: txData } = useAsyncData(
  `upgrade-tx-${props.options.chainId}`,
  async () => {
    await fetchAvowalletImpl()

    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      getRpcProviderByChainId(props.options.chainId),
    )

    const data = await wallet.populateTransaction.upgradeTo(
      avoWalletImpAddress.value,
    )

    return data
  },
  {
    immediate: true,
  },
)

const { pending, data, error } = useEstimatedFee(
  txData,
  ref(String(props.options.chainId)),
)

async function handleSubmit() {
  try {
    submitting.value = true

    const metadata = encodeUpgradeMetadata({
      version: utils.formatBytes32String(props.options.latestVersion || ''),
      walletImpl: avoWalletImpAddress.value,
    })

    const transactionHash = await sendTransaction(
      {
        data: txData.value?.data,
        chainId: props.options.chainId,
        to: safeAddress.value,
      },
      {
        metadata,
      },
      'upgrade',
    )

    if (!transactionHash)
      return

    logActionToSlack({
      message: generateSlackMessage(metadata, props.options.chainId),
      action: 'upgrade',
      chainId: String(props.options.chainId),
      account: account.value,
    })

    emit('destroy')

    showPendingTransactionModal({
      hash: transactionHash!,
      chainId: props.options.chainId,
      type: 'upgrade',
      async: true,
    })
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      type: 'error',
      action: 'upgrade',
      chainId: String(props.options.chainId),
      account: account.value,
      message: err.parsed,
    })
  }
  finally {
    submitting.value = false
  }
}

onUnmounted(() => {
  clearNuxtData('upgrade-tx')
})
</script>

<template>
  <div class="flex flex-col gap-7.5 text-center">
    <div class="flex flex-col items-center justify-center gap-7.5">
      <ChainLogo class="h-10 w-10" :chain="options.chainId" />
      <span class="text-lg leading-5">{{ chainIdToName(options.chainId) }} Upgrade</span>
    </div>
    <div class="flex items-center justify-center gap-3">
      <span
        class="flex items-center justify-center rounded-5 bg-gray-900 px-4 py-2 text-sm"
      >
        v{{ options.currentVersion }}
      </span>
      <ArrowRight class="h-[18px] w-[18px] text-gray-400" />
      <span
        class="flex items-center justify-center rounded-5 bg-gray-900 px-4 py-2 text-sm"
      >
        v{{ options.latestVersion }}
      </span>
    </div>
    <EstimatedFee
      :chain-id="String(options.chainId)"
      :loading="pending"
      :data="data"
      :error="error"
    />
    <CommonButton
      :loading="pending || submitting"
      :disabled="pending || submitting || error || !txData"
      class="w-full justify-center"
      size="lg"
      @click="handleSubmit"
    >
      Upgrade
    </CommonButton>
  </div>
</template>
