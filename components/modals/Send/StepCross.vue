<script setup lang="ts">
import { ethers } from 'ethers'
import { serialize } from 'error-serializer'
import { storeToRefs } from 'pinia'
import { parse } from 'semver'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import RefreshSVG from '~/assets/images/icons/refresh.svg?component'

const { isProd } = useAppConfig()
const { token, stepBack, data, actualAddress, targetToken } = useSend()
const { gasBalance, safeOptions, isSelectedSafeLegacy, selectedSafe } = storeToRefs(useSafe())
const { account } = useWeb3()
const { toWei, fromWei } = useBignumber()
const { safeAddress, tokenBalances, generateMultisigSignatureMessage, generateSignatureMessage, authenticateTransactionMfa, isEligableToProceed2FA } = useAvocadoSafe()
const { avoProvider } = useSafe()
const { parseTransactionError } = useErrorHandler()
const { getMFAToken } = useMfa()

const fallbackFee: TotalFee = {
  amount: '0',
  amountInUsd: '0',
  token: null,
}

const error = ref('')
const bestRoute = ref<IRoute>()
const buildTransaction = ref<IScoketBuildTxResult>()
const isSubmitting = ref(false)

const crossSignatures = ref<ICrossSignatures>()
const targetMessage = ref()
const sourceMessage = ref()

const destroyModal = inject('destroy') as () => void

const defaultFee = calculateEstimatedFee({
  chainId: String(data.value.toChainId),
})

const crossFee = ref({
  data: defaultFee,
  pending: false,
  error: '',
})

const formattedNetwork = computed(() => `:${formatChainName(data.value.fromChainId)}: → :${formatChainName(data.value.toChainId)}: Cross-chain Send Transaction`)

const nativeFee = computed(() => {
  if (!buildTransaction.value?.result || !nativeCurrency.value)
    return '0'

  let v = fromWei(buildTransaction.value?.result?.value || '0', nativeCurrency.value?.decimals).toFixed()

  if (
    data.value.tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
  ) {
    v = toBN(v)
      .minus(data.value.amount || '0')
      .toFixed(0)
  }

  return v
})

const displayTargetToken = computed(() => {
  if (token.value?.symbol.toLowerCase() === targetToken.value?.symbol.toLowerCase())
    return token.value

  return targetToken.value
})

const nativeFeeInUsd = computed(() => {
  if (!nativeFee.value)
    return '0'

  return times(nativeFee.value || '0', nativeCurrency.value?.price || '0')
})

const nativeCurrency = computed(() => {
  const nativeTokenMeta = getNetworkByChainId(+data.value.fromChainId).params
    .nativeCurrency

  return tokenBalances.value.find(
    t =>
      String(t.chainId) == String(data.value.fromChainId)
        && t.symbol.toLowerCase() === nativeTokenMeta?.symbol?.toLowerCase(),
  )
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
  if (!nativeFee.value)
    return false

  return toBN(nativeCurrency.value?.balance || '0').lt(nativeFee.value)
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
        bridgeWithGas: false,
        defaultBridgeSlippage: 1,
        singleTxOnly: true,
        sort: 'output',
      },
    })

    if (!quoteRoute.success)
      throw new Error('Can\'t get quote, please try again later')
    if (!quoteRoute.result.routes.length)
      throw new Error('Our bridge provider does not have routes for your desired transfer')

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

function getMetadata() {
  return encodeCrossTransferMetadata({
    fromToken: token.value?.address!,
    toToken: targetToken.value?.address,
    toChainId: String(data.value.toChainId),
    amount: bestRoute.value?.toAmount,
    receiver: actualAddress.value,
  })
}

async function fetchBestRoute() {
  error.value = ''
  buildTransaction.value = undefined

  try {
    if (!targetToken.value?.address)
      throw new Error('No bridge token found')

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

    buildTransaction.value = buildTx

    const approvalData = buildTx.result.approvalData

    const transferAmount = toWei(data.value.amount, token.value?.decimals!).toString()

    const targetActions = [
      targetToken.value.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'.toLowerCase()
        ? { // Native token transfer
            to: actualAddress.value,
            data: '0x',
            operation: '0',
            value: transferAmount,
          }
        : { // ERC20 token transfer
            to: targetToken.value.address,
            data: (new ethers.utils.Interface(ERC20ABI)).encodeFunctionData('transfer', [actualAddress.value, transferAmount]),
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

    const metadata = getMetadata()

    let tMessage
    let sMessage

    if (isSelectedSafeLegacy.value) {
      tMessage = await generateSignatureMessage({
        actions: targetActions,
        chainId: data.value.toChainId,
        options: {
          metadata,
        },
      })

      sMessage = await generateSignatureMessage({
        actions: sourceActions,
        chainId: data.value.fromChainId,
        options: {
          metadata,
        },
      })
    }
    else {
      tMessage = await generateMultisigSignatureMessage({
        chainId: data.value.toChainId,
        actions: targetActions,
        metadata,
        nonce: -1,
      })

      sMessage = await generateMultisigSignatureMessage({
        chainId: data.value.fromChainId,
        actions: sourceActions,
        metadata,
        nonce: -1,
      })
    }

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

const feeInfoMessage = computed(() => {
  if (!bridgeFee.value?.token || !nativeFee.value)
    return

  const amounts = [
    {
      amount: bridgeFee.value?.amount,
      symbol: bridgeFee.value.token?.symbol?.toUpperCase(),
      amountInUsd: bridgeFee.value?.amountInUsd,
    },
    {
      amount: nativeFee.value,
      symbol: nativeCurrency.value?.symbol?.toLowerCase(),
      amountInUsd: times(nativeFee.value!, nativeCurrency.value?.price || 0),
    },
  ]

  const filteredAmounts = amounts.filter(item => toBN(item.amount).gt('0'))

  if (!filteredAmounts.length)
    return

  const formattedAmounts = filteredAmounts.map((i) => {
    return `${formatDecimal(i.amount, 4)} ${i.symbol} (${formatUsd(i.amountInUsd)})`
  })

  const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' })
  const formattedString = formatter.format(formattedAmounts)

  return `The third-party bridge provider will charge an additional fee of ${formattedString} for their bridging service.`
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

    await onSubmit()
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

    const source = safeOptions.value.find(i => i.chainId == data.value.fromChainId)
    const target = safeOptions.value.find(i => i.chainId == data.value.toChainId)

    const sourceVersion = source?.notdeployed ? source?.latestVersion : source?.currentVersion
    const targetVersion = target?.notdeployed ? target?.latestVersion : target?.currentVersion

    const body = {
      staging: !isProd,
      sourceChainId: String(data.value.fromChainId),
      targetChainId: String(data.value.toChainId),
      target: targetMessage.value,
      source: sourceMessage.value,
      bridge: {
        token: targetToken.value?.address,
        amount: toWei(data.value.amount, targetToken.value?.decimals!),
      },
      avocadoSafe: safeAddress.value,
      sourceVersion: parse(sourceVersion)?.major,
      targetVersion: parse(targetVersion)?.major,
    }

    if (isSelectedSafeLegacy.value) {
      Object.assign(body, {
        signer: account.value,
      })
    }
    else {
      Object.assign(body, {
        owner: selectedSafe.value?.owner_address,
        index: String(selectedSafe.value?.multisig_index),
      })
    }

    // @ts-expect-error
    const resp = await $fetch(`/api/cross-chain/${isSelectedSafeLegacy.value ? 'estimate' : 'multisig-estimate'}`, {
      retry: 3,
      method: 'POST',
      body,
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
    const err = serialize(e)

    crossFee.value.error = e?.response?._data?.message || err?.message || 'Failed to fetching estimated fee'
  }
  finally {
    crossFee.value.pending = false
  }
}
const disabled = computed(() => {
  return !actualAddress.value || crossFee.value.pending || !!crossFeeError.value || isSubmitting.value || !bestRoute.value || isInsufficientNativeBalance.value || isBalanceExceeded.value
})

async function executeTransaction(srcMfaToken?: string) {
  if (!token.value || !data.value)
    return

  if (!crossSignatures.value)
    throw new Error('Signatures not found')

  Object.assign(crossSignatures.value.source, {
    message: sourceMessage.value,
  })

  Object.assign(crossSignatures.value.target, {
    message: targetMessage.value,
  })

  if (!isSelectedSafeLegacy.value) {
    const transactionToken = getMFAToken()

    const mfaToken = srcMfaToken || transactionToken.value

    Object.assign(crossSignatures.value.source, {
      index: String(selectedSafe.value?.multisig_index),
      mfa_token: mfaToken,
      signatures: [{
        signature: crossSignatures.value.source.signature,
        signer: account.value,
      }],
    })

    Object.assign(crossSignatures.value.target, {
      index: String(selectedSafe.value?.multisig_index),
      signatures: [{
        signature: crossSignatures.value.target.signature,
        signer: account.value,
      }],
    })
  }

  const avocadoHash = await avoProvider.send('api_requestCrosschainTransaction', [crossSignatures.value.source, crossSignatures.value.target])

  if (!avocadoHash) {
    console.log(avocadoHash, 'Avocado hash not found', [crossSignatures.value.source, crossSignatures.value.target])
    throw new Error('Something went wrong')
  }

  const metadata = getMetadata()

  logActionToSlack({
    message: generateSlackMessage(metadata, data.value.fromChainId),
    action: 'cross-transfer',
    txHash: avocadoHash,
    chainId: String(data.value.fromChainId),
    amountInUsd: times(data.value.amount, token.value.price || '0').toFixed(),
    account: account.value,
    network: formattedNetwork.value,
  })

  destroyModal()

  showPendingCrossTransaction(avocadoHash, data.value.fromChainId, data.value.toChainId)
}

async function onSubmit() {
  try {
    isSubmitting.value = true

    const transactionToken = getMFAToken()

    const source = safeOptions.value.find(i => i.chainId == data.value.fromChainId)

    if (!source)
      throw new Error('Source config failed')

    if (isEligableToProceed2FA(source.threshold, data.value.fromChainId) && !transactionToken.value) {
      const { mfaToken } = await authenticateTransactionMfa({
        expire: '60min',
        defaultSessionAvailable: true,
        forceGrabSession: true,
      })

      await executeTransaction(mfaToken)
    }
    else {
      await executeTransaction()
    }
  }
  catch (e: any) {
    const err = parseTransactionError(e)

    openSnackbar({
      message: err.formatted,
      type: 'error',
    })

    logActionToSlack({
      message: err.formatted,
      action: 'cross-transfer',
      type: 'error',
      account: account.value,
      errorDetails: err.parsed,
      network: formattedNetwork.value,
    })
  }
  finally {
    isSubmitting.value = false
  }
}

function handleSwapToken() {
  const balancedToken = tokenBalances.value.find(
    t =>
      gt(t.balance, '0')
        && String(t.chainId) == String(data.value.fromChainId)
        && t.symbol !== nativeCurrency.value?.symbol,
  )

  const fallbackToken = tokenBalances.value.find(
    i => String(i.chainId) == String(data.value.fromChainId),
  )

  const isSameToken
      = token.value?.symbol.toLowerCase()
      === nativeCurrency.value?.symbol.toLowerCase()

  const fromToken = !isSameToken
    ? token.value
    : balancedToken || fallbackToken

  const fromAmount = toBN(nativeFeeInUsd.value)
    .div(fromToken?.price || '0')
    .toFixed(5)

  const fromAmountWithExtra = toBN(fromAmount)
    .multipliedBy('1.01')
    .toFixed(5)

  openSwapModal(
    fromToken?.address!,
    data.value.fromChainId,
    nativeCurrency.value?.address,
    fromAmountWithExtra,
  )
}

onMounted(() => {
  fetchBestRoute()
})
</script>

<template>
  <form class="flex w-full flex-col gap-7.5 sm:w-[600px]" @submit.prevent="onSubmit">
    <div class="mx-[-0.75rem] rounded-5 bg-slate-50 px-3 py-[14px] text-sm dark:bg-gray-850 sm:mx-0 sm:px-5">
      <div class="flex flex-col gap-2.5 font-medium">
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Network
          </dt>
          <dd class="flex items-center gap-2">
            <ChainLogo class="w-5" :chain="data.fromChainId" />
            <span>{{ chainIdToName(data.fromChainId) }}</span>
            <ArrowRight class="w-4 text-slate-400" />
            <ChainLogo class="w-5" :chain="data.toChainId" />
            <span>{{ chainIdToName(data.toChainId) }}</span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Token
          </dt>
          <div class="flex items-center gap-2">
            <dd class=" flex items-center gap-2">
              <SafeTokenLogo class="h-[18px] w-[18px]" :url="token?.logoURI" />
              <span class="uppercase">
                {{ token?.symbol }}
              </span>
              <span v-tippy="token?.name" class="max-w-[200px] truncate text-slate-400">
                ({{ token?.name }})
              </span>
            </dd>
            <template v-if="targetToken && token?.symbol !== targetToken?.symbol">
              <ArrowRight class="w-4 text-slate-400" />
              <dd class=" flex items-center gap-2">
                <SafeTokenLogo class="h-[18px] w-[18px]" :url="displayTargetToken?.logoURI" />
                <span class="uppercase">
                  {{ displayTargetToken?.symbol }}
                </span>
                <span v-tippy="displayTargetToken?.name" class="max-w-[200px] truncate text-slate-400">
                  ({{ displayTargetToken?.name }})
                </span>
              </dd>
            </template>
          </div>
        </dl>
        <dl class="flex flex-wrap items-center justify-between">
          <dt class="whitespace-nowrap text-slate-400">
            To address
          </dt>
          <dd>
            <NuxtLink target="_blank" class="text-xs font-medium text-primary sm:text-sm" :to="getExplorerUrl(data.toChainId, `/address/${actualAddress}`)" external>
              {{ actualAddress }}
            </NuxtLink>
          </dd>
        </dl>
      </div>
      <div class="ticket-divider my-4 w-full" />
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between leading-5">
          <span v-tippy="'This recepient will receive this exact amount'" class="inline-flex gap-3 text-2xl font-medium">
            Amount on <ChainLogo class="w-8" :chain="data.toChainId" />
          </span>
          <p class="flex items-center gap-2.5">
            <span class="uppercase">
              {{ formatDecimal(data.amount) }} {{ targetToken?.symbol || token?.symbol }}
            </span>
            <span class="text-slate-400">
              ({{ formatUsd(toBN(data.amount).times(token?.price || '0').toString()) }})
            </span>
          </p>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <p v-if="feeInfoMessage" class="-mt-2 flex items-start text-xs font-medium leading-6 text-slate-400">
        <SvgoExclamationCircle class="mr-2.5 mt-1 h-4.5 w-4.5 shrink-0 text-slate-500" />
        <span class="block">
          {{ feeInfoMessage }}
        </span>
      </p>
    </Transition>

    <EstimatedFee
      :loading="crossFee.pending"
      :data="crossFee.data"
      :error="crossFeeError"
    />

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

    <CommonNotification
      v-if="!!error"
      type="error"
      :text="error"
    />
    <CommonNotification
      v-if="nativeCurrency && isInsufficientNativeBalance"
      type="error"
      :text="`Not enough ${nativeCurrency?.symbol.toUpperCase()} balance to pay native fee.`"
    >
      <template #action>
        <CommonButton
          size="sm"
          class="flex items-center justify-center gap-[6px]"
          @click="handleSwapToken"
        >
          <RefreshSVG class="h-[14px] w-[14px]" />
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
