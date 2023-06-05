<script setup lang="ts">
import { ethers } from 'ethers'
import { serialize } from 'error-serializer'
import { storeToRefs } from 'pinia'
import { parse } from 'semver'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import RefreshSVG from '~/assets/images/icons/refresh.svg?component'
import QuestionSVG from '~/assets/images/icons/question-circle.svg?component'

const emit = defineEmits(['destroy'])
const { isProd } = useAppConfig()
const { token, stepBack, data, actualAddress, targetToken } = useSend()
const { gasBalance } = storeToRefs(useSafe())
const { account } = useWeb3()
const { toWei, fromWei } = useBignumber()
const { safeAddress, safe, tokenBalances } = useAvocadoSafe()
const { avoProvider } = useSafe()
const { parseTransactionError } = useErrorHandler()

const fallbackFee: TotalFee = {
  amount: '0',
  amountInUsd: '0',
  token: null,
}

const error = ref('')
const bestRoute = ref<IRoute>()
const isSubmitting = ref(false)

const crossSignatures = ref<ICrossSignatures>()
const targetMessage = ref()
const sourceMessage = ref()

const { data: networkVersions } = useNuxtData('allNetworkVersions')

const defaultFee = calculateEstimatedFee({
  chainId: String(data.value.toChainId),
})

const crossFee = ref({
  data: defaultFee,
  pending: false,
  error: '',
})

const totalGassFee = computed(() => {
  if (!bestRoute.value)
    return fallbackFee

  return bestRoute.value.userTxs.reduce((prev, curr) => {
    const asset = curr.gasFees.asset
    const amount = fromWei(curr.gasFees.gasAmount, asset.decimals)
    const amountInUsd = curr.gasFees.feesInUsd
    const token = tokenBalances.value.find(t => t.address.toLowerCase() === asset.address.toLowerCase() && String(asset.chainId) == String(t.chainId))

    return {
      amount: toBN(prev.amount).plus(amount).toString(),
      amountInUsd: toBN(prev.amountInUsd).plus(amountInUsd).toString(),
      token,
    } as TotalFee
  }, fallbackFee)
})

const totalReceivedAmount = computed(() => {
  if (!bestRoute.value)
    return '0'

  return fromWei(bestRoute.value.toAmount, targetToken.value?.decimals).toFixed()
})

const totalInputAmount = computed(() => {
  if (!bestRoute.value)
    return '0'

  return fromWei(bestRoute.value.fromAmount, token.value?.decimals).toString()
})

const isBalanceExceeded = computed(() => {
  if (!bestRoute.value)
    return false

  return toBN(totalInputAmount.value).gt(token.value?.balance || '0')
})

const bridgeFee = computed(() => {
  if (!bestRoute.value)
    return fallbackFee

  const fees = bestRoute.value?.userTxs.reduce((acc, tx) => {
    const bridgeFee = tx.steps.reduce((acc, step) => {
      if (!step?.protocolFees)
        return acc

      const asset = step?.protocolFees?.asset
      const token = tokenBalances.value.find(
        i => i.address.toLowerCase() === asset?.address.toLowerCase() && String(asset?.chainId) == String(i.chainId),
      )

      const amount = fromWei(
        toBN(acc.amount || '0').plus(toBN(step?.protocolFees?.amount || '0')),
        step?.protocolFees?.asset?.decimals,
      )

      return {
        amount: amount.toFixed(),
        amountInUsd: toBN(acc.amountInUsd || '0')
          .plus(amount.times(token?.price || 0))
          .toFixed(),
        token,
      } as TotalFee
    }, fallbackFee)

    return {
      amount: toBN(bridgeFee.amount)
        .plus(toBN(acc.amount || '0'))
        .toFixed(),
      amountInUsd: toBN(bridgeFee.amountInUsd)
        .plus(toBN(acc.amountInUsd || '0'))
        .toFixed(),
      token: bridgeFee.token,
    } as unknown as TotalFee
  }, fallbackFee)

  return fees
})

const isInsufficientNativeBalance = computed(() => {
  if (!totalGassFee.value.token)
    return false

  return toBN(totalGassFee.value.token.balance).lt(totalGassFee.value.amount)
})

async function fetchQuoteWithGasFee() {
  const maxTries = 3
  let tries = 0

  const desiredAmountInWei = toWei(data.value.amount, token.value?.decimals!)
  let inputAmountInWei = desiredAmountInWei

  while (tries < maxTries) {
    const quoteRoute: ISocketQuoteResult = await http('/api/socket/v2/quote', {
      params: {
        fromChainId: data.value.fromChainId,
        toChainId: data.value.toChainId,
        fromTokenAddress: token.value?.address,
        toTokenAddress: targetToken.value?.address,
        fromAmount: inputAmountInWei,
        userAddress: safeAddress.value,
        recipient: safeAddress.value,
        isContractCall: true,
        defaultBridgeSlippage: 0.5,
        singleTxOnly: true,
        sort: 'output',
      },
    })

    if (!quoteRoute.success)
      throw new Error('Can\'t get quote, please try again later')
    if (!quoteRoute.result.routes.length)
      throw new Error('No routes have been found')

    const route = quoteRoute.result.routes[0]

    const isMaxAmount = toBN(data.value.amount).eq(token.value?.balance || '0')

    if (isMaxAmount)
      return route

    const outputAmountInWei = toBN(route.toAmount)

    if (outputAmountInWei.gte(desiredAmountInWei))
      return route

    const nextIterationAmountInWei = toBN(desiredAmountInWei).minus(outputAmountInWei)
    inputAmountInWei = nextIterationAmountInWei.plus(inputAmountInWei).times(1.005).toFixed(0) // increasing by 0.5%

    tries++
  }

  throw new Error('Unable to fetch quote with acceptable gas fees after max retries')
}

async function fetchBestRoute() {
  error.value = ''
  if (!targetToken.value?.address)
    return

  try {
    isSubmitting.value = true

    const route = await fetchQuoteWithGasFee()

    bestRoute.value = route

    const buildTx: IScoketBuildTxResult = await http('/api/socket/v2/build-tx',
      {
        method: 'POST',
        body: {
          route: bestRoute.value,
        },
      },
    )

    if (!buildTx.success)
      throw new Error('Socket build transaction error, please try again later')

    const ERC20ABI = [
      'function approve(address, uint256) external',
      'function transfer(address, uint256) external',
    ]

    const approvalData = buildTx.result.approvalData

    const transferAmount = toWei(data.value.amount, token.value?.decimals!).toString()

    const targetActions = [
      {
        to: targetToken.value.address,
        data: (new ethers.utils.Interface(ERC20ABI)).encodeFunctionData('transfer', [account.value, transferAmount]),
        operation: '0',
        value: '0',
      },
    ]

    const sourceActions = [
      {
        to: buildTx.result.txTarget,
        data: buildTx.result.txData,
        operation: '0',
        value: buildTx.result.value,
      },
    ]

    if (approvalData) {
      sourceActions.unshift({
        to: approvalData.approvalTokenAddress,
        data: (new ethers.utils.Interface(ERC20ABI)).encodeFunctionData('approve', [approvalData.allowanceTarget, approvalData.minimumApprovalAmount]),
        operation: '0',
        value: '0',
      })
    }

    const tMessage = await safe.value?.generateSignatureMessage(
      targetActions,
      data.value.toChainId,
    )

    const metadata = encodeCrossTransferMetadata({
      fromToken: token.value?.address,
      toToken: targetToken.value?.address,
      toChainId: data.value.toChainId,
      amount: bestRoute.value.toAmount,
      receiver: data.value.address,
    })

    const sMessage = await safe.value?.generateSignatureMessage(
      sourceActions,
      data.value.fromChainId,
      {
        metadata,
      },
    )

    targetMessage.value = tMessage
    sourceMessage.value = sMessage

    fetchCrossFee()
  }
  catch (e: any) {
    const err = serialize(e)

    error.value = err.message
  }
  finally {
    isSubmitting.value = false
  }
}

const crossFeeError = computed(() => {
  if (crossFee.value.pending)
    return
  if (crossFee.value.error)
    return crossFee.value.error

  if (toBN(gasBalance.value).lt(crossFee.value.data?.amountAfterDiscount!))
    return 'Not enough USDC gas'
})

async function fetchcrossSignatures() {
  try {
    if (!targetToken.value)
      return

    isSubmitting.value = true

    const { payload, success } = await openSignCrossSendTx({
      sourceChainId: data.value.fromChainId,
      targetChainId: data.value.toChainId,
      sourceMessage: sourceMessage.value,
      targetMessage: targetMessage.value,
    })

    if (!success)
      throw new Error('Rejected by user')

    crossSignatures.value = payload
  }
  catch (e: any) {
    const err = serialize(e)

    openSnackbar({
      message: err.message,
      type: 'error',
    })
  }
  finally {
    isSubmitting.value = false
  }
}

async function fetchCrossFee() {
  try {
    if (isInsufficientNativeBalance.value)
      return

    if (isBalanceExceeded.value)
      return

    crossFee.value.pending = true

    const source = networkVersions.value.find((i: any) => i.chainId == data.value.fromChainId)
    const target = networkVersions.value.find((i: any) => i.chainId == data.value.toChainId)

    const sourceVersion = source?.notdeployed ? source?.latestVersion : source?.currentVersion
    const targetVersion = target?.notdeployed ? target?.latestVersion : target?.currentVersion

    const resp = await $fetch('/api/cross-chain/estimate', {
      method: 'POST',
      body: {
        staging: !isProd,
        sourceChainId: String(data.value.fromChainId),
        targetChainId: String(data.value.toChainId),
        target: targetMessage.value,
        source: sourceMessage.value,
        bridge: {
          token: targetToken.value?.address,
          amount: toWei(data.value.amount, targetToken.value?.decimals!),
        },
        signer: account.value,
        avocadoSafe: safeAddress.value,
        sourceVersion: parse(sourceVersion)?.major,
        targetVersion: parse(targetVersion)?.major,
      },
    }) as ICrossEstimatedFee

    if (toBN(resp.target?.fee).isNaN() || toBN(resp.source?.fee).isNaN()) {
      console.log(resp)
      throw new Error('Something went wrong')
    }

    const targetFee = calculateEstimatedFee({
      chainId: String(data.value.fromChainId),
      fee: resp.target.fee,
      multiplier: resp.target.multiplier,
      discountDetails: resp.target.discount?.name ? [resp.target.discount] : [],
    })

    const sourceFee = calculateEstimatedFee({
      chainId: String(data.value.fromChainId),
      fee: resp.source.fee,
      multiplier: resp.source.multiplier,
      discountDetails: resp.source.discount?.name ? [resp.source.discount] : [],
    })

    const mergedFees = calculateMultipleEstimatedFee(targetFee, sourceFee)

    crossFee.value.data = mergedFees
  }
  catch (e: any) {
    crossFee.value.error = e.data?.data?.message || e?.message || 'Something went wrong'
  }
  finally {
    crossFee.value.pending = false
  }
}
const disabled = computed(() => {
  return !actualAddress.value || crossFee.value.pending || !!crossFeeError.value || isSubmitting.value || !bestRoute.value || isInsufficientNativeBalance.value || isBalanceExceeded.value
})

async function onSubmit() {
  const formattedNetwork = `:${formatChainName(data.value.fromChainId)}: → :${formatChainName(data.value.toChainId)}: Cross-chain Send Transaction`

  try {
    if (!token.value || !data.value)
      return

    isSubmitting.value = true

    if (!crossSignatures.value)
      throw new Error('Signatures not found')

    Object.assign(crossSignatures.value.source, {
      message: sourceMessage.value,
    })

    Object.assign(crossSignatures.value.target, {
      message: targetMessage.value,
    })

    const avocadoHash = await avoProvider.send('api_requestCrosschainTransaction', [crossSignatures.value.source, crossSignatures.value.target])

    logActionToSlack({
      message: `${formatDecimal(data.value.amount)} ${formatSymbol(
        token.value.symbol,
      )} to ${actualAddress.value}`,
      action: 'send',
      txHash: avocadoHash,
      chainId: String(data.value.toChainId),
      account: account.value,
      network: formattedNetwork,
    })

    emit('destroy')

    showPendingCrossTransaction(avocadoHash, data.value.fromChainId, data.value.toChainId)
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'send',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
      network: formattedNetwork,
    })
  }
  finally {
    isSubmitting.value = false
  }
}

function handleSwapToken() {
  const nativeToken = totalGassFee.value.token

  const balancedToken = tokenBalances.value.find(
    t =>
      gt(t.balance, '0')
        && String(t.chainId) == String(data.value.fromChainId)
        && t.symbol !== nativeToken?.symbol,
  )

  const fallbackToken = tokenBalances.value.find(
    i => String(i.chainId) == String(data.value.fromChainId),
  )

  const isSameToken
      = token.value?.symbol.toLowerCase()
      === nativeToken?.symbol.toLowerCase()

  const fromToken = !isSameToken
    ? token.value
    : balancedToken || fallbackToken

  const fromAmount = toBN(totalGassFee.value.amountInUsd)
    .div(fromToken?.price || '0')
    .toFixed(5)

  const fromAmountWithExtra = toBN(fromAmount)
    .multipliedBy('1.01')
    .toFixed(5)

  openSwapModal(
    fromToken?.address!,
    data.value.fromChainId,
    nativeToken?.address,
    fromAmountWithExtra,
  )
}

onMounted(() => {
  fetchBestRoute()
})
</script>

<template>
  <form class="flex flex-col gap-7.5 sm:w-[600px] w-full" @submit.prevent="onSubmit">
    <div class="bg-slate-50 dark:bg-gray-850 rounded-5 py-[14px] px-5 text-sm">
      <div class="flex flex-col gap-2.5 font-medium">
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Network
          </dt>
          <dd class="flex items-center gap-2">
            <ChainLogo class="w-5" :chain="data.fromChainId" />
            <span>{{ chainIdToName(data.fromChainId) }}</span>
            <ArrowRight class="text-slate-400 w-4" />
            <ChainLogo class="w-5" :chain="data.toChainId" />
            <span>{{ chainIdToName(data.toChainId) }}</span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Token
          </dt>
          <dd class="uppercase items-center flex gap-2">
            <SafeTokenLogo class="w-[18px] h-[18px]" :url="token?.logoURI" />
            {{ token?.symbol }}
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400 whitespace-nowrap">
            Dest. address
          </dt>
          <dd>
            <NuxtLink target="_blank" class="text-primary font-medium" :to="getExplorerUrl(data.toChainId, `/address/${data.address}`)" external>
              {{ data.address }}
            </NuxtLink>
          </dd>
        </dl>
        <div class="ticket-divider w-full my-[6px]" />
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Gas fees
          </dt>
          <dd class="flex items-center gap-2">
            <img v-if="totalGassFee.token" class="w-5 h-5" :src="totalGassFee.token?.logoURI">
            <span>
              {{ formatDecimal(totalGassFee.amount) }}
            </span>
            <span class="text-slate-400">
              ({{ formatUsd(totalGassFee.amountInUsd || "0") }})
            </span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Bridge Fee
          </dt>
          <dd class="flex items-center gap-2">
            <img v-if="bridgeFee.token" class="w-5 h-5" :src="bridgeFee.token?.logoURI">
            <span>
              {{ formatDecimal(bridgeFee.amount) }}
            </span>
            <span class="text-slate-400">
              ({{ formatUsd(bridgeFee.amountInUsd || "0") }})
            </span>
          </dd>
        </dl>
      </div>
      <div class="ticket-divider w-full my-4" />
      <div class="flex flex-col gap-2.5">
        <div class="flex justify-between items-center leading-5">
          <span class="font-medium inline-flex gap-2.5 items-center">
            Amount receiving on dest. address

            <QuestionSVG v-tippy="`Amount bridged to ${chainIdToName(data.toChainId)} wallet will be ${formatDecimal(totalReceivedAmount)} ${token?.symbol?.toUpperCase()} (after deducting fees) & final amount credited to destination address(${shortenHash(data.address)}) will be ${data.amount} ${token?.symbol?.toUpperCase()}`" class="w-4.5 h-4.5 text-slate-500" />

          </span>
          <p class="flex items-center gap-2.5">
            <span class="uppercase text-base">
              {{ formatDecimal(data.amount) }} {{ token?.symbol }}
            </span>

            <span class="text-slate-400">
              ({{ formatUsd(toBN(data.amount).times(token?.price || '0').toFixed()) }})
            </span>
          </p>
        </div>
        <div class="flex justify-between leading-5 items-center">
          <span class="font-medium">
            Amount to be deducted
          </span>
          <p class="flex items-center gap-2.5">
            <span class="uppercase text-base">
              {{ formatDecimal(totalInputAmount) }} {{ token?.symbol }}
            </span>
            <span class="text-slate-400">
              ({{ formatUsd(bestRoute?.inputValueInUsd || "0") }})
            </span>
          </p>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-5">
      <CommonButton color="white" class="justify-center" size="lg" @click="stepBack">
        Back
      </CommonButton>

      <CommonButton v-if="!crossSignatures" :disabled="disabled " :loading="crossFee.pending || isSubmitting" class="justify-center" size="lg" @click="fetchcrossSignatures">
        Sign
      </CommonButton>
      <CommonButton v-else :disabled="disabled" :loading="crossFee.pending || isSubmitting" type="submit" class="justify-center" size="lg">
        Send
      </CommonButton>
    </div>
    <EstimatedFee
      :loading="crossFee.pending"
      :data="crossFee.data"
      :error="crossFeeError"
    />
    <CommonNotification
      v-if="!!error"
      type="error"
      :text="error"
    />
    <CommonNotification
      v-if="totalGassFee.token && isInsufficientNativeBalance"
      type="error"
      :text="`Not enough ${totalGassFee.token?.symbol.toUpperCase()} balance to pay the bridge gas fee.`"
    >
      <template #action>
        <CommonButton
          size="sm"
          class="flex gap-[6px] items-center justify-center"
          @click="handleSwapToken"
        >
          <RefreshSVG class="w-[14px] h-[14px]" />
          Swap Token
        </CommonButton>
      </template>
    </CommonNotification>
    <CommonNotification
      v-if="isBalanceExceeded"
      type="warning"
      text="The amount you are trying to send is more than your balance, please reduce the amount."
    />
  </form>
</template>
