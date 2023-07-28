import { isArray } from '@vue/shared'

interface EstimatedFeeParams {
  immediate?: boolean
  cb?: () => void
  disabled?: () => boolean
  options?: any
}

export function useEstimatedFee(
  txData: Ref,
  chainId: Ref,
  params?: EstimatedFeeParams,
) {
  const { avoProvider } = useSafe()
  const { account } = useWeb3()
  const { trackingAccount, isTrackingMode } = useAccountTrack()
  const { safe, generateMultisigSignatureMessage } = useAvocadoSafe()
  const { gasBalance, safeAddress, selectedSafe } = storeToRefs(useSafe())
  const { isSafeMultisig } = storeToRefs(useMultisig())

  const immediate = !!params?.immediate

  const data = computed(() => {
    const discountDetails: DiscountDetails = {
      name: rawData.value?.discount?.name || '',
      amount: rawData.value?.discount?.amount || 0,
      description: rawData.value?.discount?.description || '',
    }

    const isDiscountAvailable = !!rawData.value?.discount?.name

    return calculateEstimatedFee({
      chainId: chainId.value,
      ...rawData.value,
      discountDetails: isDiscountAvailable ? [discountDetails] : [],
    })
  })

  const err = computed(() => {
    const message = 'Something went wrong. Please try again!'
    if (pending.value)
      return
    if (error.value) {
      console.log(error.value)
      return message
    }

    if (rawData.value && (!rawData.value?.fee || !rawData.value?.multiplier))
      return message

    if (toBN(gasBalance.value).lt(data.value?.amountAfterDiscount!))
      return 'Not enough USDC gas'
  })

  const {
    data: rawData,
    error,
    pending,
  } = useAsyncData<IEstimatedFeeData>(
    `estimated-fee-${chainId.value}`,
    async () => {
      try {
        const disabled = params?.disabled?.()
        if (disabled)
          return

        if (!txData.value)
          return

        const isArr = isArray(txData.value)

        if (isArr && txData.value.length === 0)
          return

        const actualTx = isArray(txData.value) ? txData.value : [txData.value]

        let message

        if (isSafeMultisig.value) {
          message = await generateMultisigSignatureMessage({ chainId: chainId.value, actions: actualTx, options: params?.options })

          console.log(message)
        }
        else {
          message = await safe.value?.generateSignatureMessage(
            actualTx,
            +chainId.value,
            params?.options,
          )
        }

        const actualAccount = isTrackingMode.value ? trackingAccount.value : account.value

        const signatureParams = { message, signer: actualAccount, targetChainId: chainId.value, safe: safeAddress.value, owner: selectedSafe.value?.owner_address || account.value }
        const signatureMethod = isSafeMultisig.value ? 'txn_multisigEstimateFeeWithoutSignature' : 'txn_estimateFeeWithoutSignature'

        const data = await avoProvider.send(signatureMethod, [
          signatureParams,
        ])

        return data
      }
      finally {
        params?.cb?.()
      }
    },
    {
      server: false,
      immediate,
      watch: [txData],
    },
  )

  onUnmounted(() => {
    clearNuxtData('estimated-fee')
  })

  return {
    data,
    rawData,
    error: err,
    pending,
  }
}
