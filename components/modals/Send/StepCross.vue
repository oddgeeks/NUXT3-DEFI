<script setup lang="ts">
import { ethers } from 'ethers'
import { serialize } from 'error-serializer'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import RefreshSVG from '~/assets/images/icons/refresh.svg'

const emit = defineEmits(['destroy'])
const { isProd } = useAppConfig()
const { token, stepBack, data, actualAddress, targetToken } = useSend()
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

const isInsufficientBalance = computed(() => {
  if (!totalGassFee.value.token)
    return false

  return toBN(totalGassFee.value.token.balance).lt(totalGassFee.value.amount)
})

async function fetchQuoteWithGasFee() {
  const maxTries = 3
  let tries = 0
  let amount = data.value.amount

  while (tries < maxTries) {
    const quoteRoute: ISocketQuoteResult = await http('/api/socket/v2/quote', {
      params: {
        fromChainId: data.value.fromChainId,
        toChainId: data.value.toChainId,
        fromTokenAddress: token.value?.address,
        toTokenAddress: targetToken.value?.address,
        fromAmount: toWei(amount, token.value?.decimals!),
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
      throw new Error('No routes has been found')

    const route = quoteRoute.result.routes[0]

    const receivedValueInUsd = toBN(route.receivedValueInUsd)
    const desiredValueInUsd = toBN(data.value.amount).times(targetToken.value?.price || 0)
    const totalGasFeesInUsd = toBN(route.inputValueInUsd).minus(receivedValueInUsd)

    if (receivedValueInUsd.gte(desiredValueInUsd))
      return route

    const totalGasFeeInAmount = totalGasFeesInUsd.div(token.value?.price || 1)

    amount = toBN(amount).plus(totalGasFeeInAmount).toString()
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

    const transferAmount = bestRoute.value.userTxs[0].steps[0].minAmountOut.toString()

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
        to: approvalData.approvalTokenAddress,
        data: (new ethers.utils.Interface(ERC20ABI)).encodeFunctionData('approve', [approvalData.allowanceTarget, approvalData.minimumApprovalAmount]),
        operation: '0',
        value: '0',
      },
      {
        to: buildTx.result.txTarget,
        data: buildTx.result.txData,
        operation: '0',
        value: '0',
      },
    ]

    const tMessage = await safe.value?.generateSignatureMessage(
      targetActions,
      data.value.toChainId,
    )

    const sMessage = await safe.value?.generateSignatureMessage(
      sourceActions,
      data.value.fromChainId,
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
    if (isInsufficientBalance.value)
      return

    crossFee.value.pending = true

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
      },
    }) as ICrossEstimatedFee

    const combinedFeeParams = [resp.target, resp.source].reduce(
      (acc, curr) => {
        acc.fee = toBN(acc.fee).plus(toBN(curr.fee)).toString()
        acc.multiplier = toBN(acc.multiplier).plus(toBN(curr.multiplier)).toString()
        return acc
      },
      { fee: '0', multiplier: '0' },
    )

    crossFee.value.data = calculateEstimatedFee({
      chainId: String(data.value.fromChainId),
      fee: combinedFeeParams.fee,
      multiplier: combinedFeeParams.multiplier,
    })
  }
  catch (e) {
    const parsed = serialize(e)
    crossFee.value.error = parsed.message
  }
  finally {
    crossFee.value.pending = false
  }
}
const disabled = computed(() => {
  return !actualAddress.value || crossFee.value.pending || crossFee.value.error || isSubmitting.value || !bestRoute.value || isInsufficientBalance.value
})

async function onSubmit() {
  try {
    if (!token.value || !data.value)
      return

    isSubmitting.value = true

    if (!crossSignatures.value)
      throw new Error('Signatures not found')

    const metadata = encodeCrossTransferMetadata(
      {
        fromToken: data.value.tokenAddress,
        toToken: targetToken.value?.address,
        toChainId: data.value.toChainId,
        amount: toWei(data.value.amount, token.value?.decimals),
        receiver: data.value.address,
      },
      true,
    )

    const transactionHash = await avoProvider.send('api_requestCrosschainTransaction', [crossSignatures.value.source, crossSignatures.value.target])

    console.log({
      transactionHash,
      crossSignatures: crossSignatures.value,

    })

    // wait 10 sec
    // await new Promise(resolve => setTimeout(resolve, 10000))

    // const tx = await avoProvider.send('api_getCrosschainTransaction', [
    //   transactionHash,
    // ])

    // console.log(tx)

    if (!transactionHash)
      throw new Error('Transaction not found')

    logActionToSlack({
      message: `${formatDecimal(data.value.amount)} ${formatSymbol(
        token.value.symbol,
      )} to ${actualAddress.value}`,
      action: 'send',
      txHash: transactionHash,
      chainId: String(data.value.toChainId),
      account: account.value,
    })

    emit('destroy')

    showPendingTransactionModal(transactionHash, data.value.toChainId, 'send')
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
    })
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchBestRoute()
})
</script>

<template>
  <form class="flex flex-col gap-7.5 sm:w-[520px] w-full" @submit.prevent="onSubmit">
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
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Gas fees
          </dt>
          <dd class="flex items-center gap-2">
            <img v-if="totalGassFee.token" class="w-5 h-5" :src="totalGassFee.token?.logoURI">
            <span>
              {{ formatDecimal(totalGassFee.amount) }}
            </span>
            <span>
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
            <span>
              ({{ formatUsd(bridgeFee.amountInUsd || "0") }})
            </span>
          </dd>
        </dl>
      </div>
      <div class="ticket-divider w-full my-4" />
      <div class="flex flex-col gap-[6px] text-base">
        <div class="flex justify-between items-center leading-5">
          <span class="font-medium">
            Amount receiving on dest. address
          </span>
          <p class="flex items-center gap-2.5">
            <span class="uppercase">
              {{ formatUsd(bestRoute?.receivedValueInUsd || "0") }}
            </span>
          </p>
        </div>
        <div class="flex justify-between leading-5 items-center">
          <span class="font-medium">
            Amount to be deducted
          </span>
          <p class="flex items-center gap-2.5">
            <span class="uppercase">
              {{ formatUsd(bestRoute?.inputValueInUsd || "0") }}
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
      :error="crossFee.error"
    />
    <CommonNotification
      v-if="!!error"
      type="error"
      :text="error"
    />
    <CommonNotification
      v-if="totalGassFee.token && isInsufficientBalance"
      type="error"
      :text="`Not enough ${totalGassFee.token?.symbol.toUpperCase()} balance`"
    >
      <template #action>
        <CommonButton
          size="sm"
          class="flex gap-[6px] items-center justify-center"
        >
          <RefreshSVG class="w-[14px] h-[14px]" />
          Swap Token
        </CommonButton>
      </template>
    </CommonNotification>
  </form>
</template>
