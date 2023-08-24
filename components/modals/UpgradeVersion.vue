<script setup lang="ts">
import { utils } from 'ethers'
import { MultisigForwarder__factory } from '@instadapp/avocado-base/contracts'
import {
  AvoFactoryProxy__factory,
  Forwarder__factory,
  GaslessWallet__factory,
} from '@/contracts'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'

const props = defineProps<{
  network: NetworkVersion
}>()

const emit = defineEmits(['destroy'])

const { safeAddress, sendTransaction } = useAvocadoSafe()
const { isSafeMultisig } = storeToRefs(useMultisig())
const { forwarderProxyAddress, fetchNetworkVersions } = useSafe()
const { parseTransactionError } = useErrorHandler()
const { getRpcProviderByChainId } = useShared()

const { account } = useWeb3()
const submitting = ref(false)

const avoWalletImpAddress = ref('')

async function fetchAvowalletImpl() {
  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    getRpcProviderByChainId(props.network.chainId),
  )

  const multisigForarderContract = MultisigForwarder__factory.connect(
    multisigForwarderProxyAddress,
    getRpcProviderByChainId(props.network.chainId),
  )

  const avoFactory = await forwarderProxyContract.avoFactory()

  const avoMultisigFactory = await multisigForarderContract.avoFactory()

  const avoFactoryProxyContract = AvoFactoryProxy__factory.connect(
    avoFactory,
    getRpcProviderByChainId(props.network.chainId),
  )

  const multisigAvoFactoryProxyContract = AvoFactoryProxy__factory.connect(
    avoMultisigFactory,
    getRpcProviderByChainId(props.network.chainId),
  )

  const avoWalletImpl = isSafeMultisig.value ? await multisigAvoFactoryProxyContract.avoWalletImpl() : await avoFactoryProxyContract.avoWalletImpl()

  console.log(avoWalletImpl, { isSafeMultisig: isSafeMultisig.value })

  avoWalletImpAddress.value = avoWalletImpl
  return avoWalletImpl
}

const { data: txData } = useAsyncData(
  'upgrade-tx',
  async () => {
    await fetchAvowalletImpl()

    const wallet = GaslessWallet__factory.connect(
      safeAddress.value,
      getRpcProviderByChainId(props.network.chainId),
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
  ref(String(props.network.chainId)),
)

async function handleSubmit() {
  try {
    submitting.value = true

    const metadata = encodeUpgradeMetadata({
      version: utils.formatBytes32String(props.network.latestVersion || ''),
      walletImpl: avoWalletImpAddress.value,
    })

    const transactionHash = await sendTransaction(
      {
        data: txData.value?.data,
        chainId: props.network.chainId,
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
      action: 'upgrade',
      chainId: String(props.network.chainId),
      account: account.value,
      message: `Upgraded to ${props.network.latestVersion}`,
    })

    setTimeout(() => {
      fetchNetworkVersions()
    }, 10000)

    emit('destroy')

    showPendingTransactionModal(
      transactionHash!,
      props.network.chainId,
      'upgrade',
      true,
    )
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
      chainId: String(props.network.chainId),
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
  <div class="text-center flex gap-7.5 flex-col">
    <div class="flex flex-col justify-center gap-7.5 items-center">
      <ChainLogo class="w-10 h-10" :chain="network.chainId" />
      <span class="text-lg leading-5">{{ chainIdToName(network.chainId) }} Upgrade</span>
    </div>
    <div class="flex items-center justify-center gap-3">
      <span
        class="bg-slate-800 py-2 px-4 rounded-5 items-center justify-center flex text-sm"
      >
        v{{ network.currentVersion }}
      </span>
      <ArrowRight class="w-[18px] h-[18px] text-slate-400" />
      <span
        class="bg-slate-800 py-2 px-4 rounded-5 items-center justify-center flex text-sm"
      >
        v{{ network.latestVersion }}
      </span>
    </div>
    <EstimatedFee
      :chain-id="String(network.chainId)"
      :loading="pending"
      :data="data"
      :error="error"
    />
    <CommonButton
      :loading="pending || submitting"
      :disabled="pending || submitting || error || !txData"
      class="justify-center w-full"
      size="lg"
      @click="handleSubmit"
    >
      Upgrade
    </CommonButton>
  </div>
</template>
