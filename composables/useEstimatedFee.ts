import { isArray } from '@vue/shared'
import { storeToRefs } from 'pinia'

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
  const { safe } = useAvocadoSafe()
  const { gasBalance } = storeToRefs(useSafe())

  const immediate = !!params?.immediate

  const data = computed(() => {
    const discountDetails: DiscountDetails = {
      name: rawData.value?.discount?.name || '',
      discount: rawData.value?.discount?.amount || 0,
      tooltip: rawData.value?.discount?.description || '',
    }

    console.log(rawData.value)

    return calculateEstimatedFee({
      chainId: chainId.value,
      ...rawData.value,
      discountDetails,
    })
  })

  const err = computed(() => {
    const message = 'Something went wrong. Please try again!'
    if (pending.value)
      return
    if (error.value)
      return message

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
    'estimated-fee',
    async () => {
      try {
        const disabled = params?.disabled?.()
        if (disabled)
          return

        console.log(chainId.value)

        if (!txData.value)
          return

        const isArr = isArray(txData.value)

        if (isArr && txData.value.length === 0)
          return

        const actualTx = isArray(txData.value) ? txData.value : [txData.value]

        const message = await safe.value?.generateSignatureMessage(
          actualTx,
          +chainId.value,
          params?.options,
        )

        const actualAccount = isTrackingMode.value ? trackingAccount.value : account.value

        const data = await avoProvider.send('txn_estimateFeeWithoutSignature', [
          message,
          actualAccount,
          chainId.value,
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
