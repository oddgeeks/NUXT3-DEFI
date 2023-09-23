import { isArray } from '@vue/shared'
import { isUndefined } from '@walletconnect/utils'

interface EstimatedFeeParams {
  immediate?: boolean
  cb?: () => void
  disabled?: () => boolean
  options?: any
  metadata?: string
  nonce?: number | string
}

interface EstimatedFeeRetry {
  active: boolean
  count: Ref<number>
  max: number
  cb: (count: EstimatedFeeRetry['count'], max?: number) => void
}

/**
 * Called by components that need to know the estimated gas fees.
 * It is expected that the calling component will pass the transaction data, and upon changes to txData
 * this function will automatically recalculate the estimated fees.
 * To implement retry logic pass in the retry param with a cb function that triggers a change in txData and increments the retry count.
 * See usage in Swap modal for example of retry logic.
 * @param txData The transaction data coming from the calling component
 * @param chainId
 * @param params CB functions and other params
 * @param retry Used to implement retry logic from the calling component
 * @returns Ref<CalculatedFee>
 */
export function useEstimatedFee(
  txData: Ref,
  chainId: Ref,
  params?: EstimatedFeeParams,
  retry?: EstimatedFeeRetry,
) {
  const { avoProvider } = useSafe()
  const { account } = useWeb3()
  const { safe, generateMultisigSignatureMessage } = useAvocadoSafe()
  const { gasBalance, safeAddress, selectedSafe, isSelectedSafeLegacy } = storeToRefs(useSafe())
  const { parseTransactionError } = useErrorHandler()

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
      const formatted = parseTransactionError(error.value)?.formatted

      return formatted || message
    }

    if (rawData.value && (!rawData.value?.fee || !rawData.value?.multiplier))
      return message

    if (toBN(gasBalance.value).lt(data.value?.amountAfterDiscount!))
      return 'Not enough USDC gas'

    if (toBN(gasBalance.value).lt(toBN(data.value?.amountAfterDiscount).times(1.1))) {
      return 'Estimated gas and current balance are very close, due to market fluctuation tx might fail.'
    }
  })

  const {
    data: rawData,
    error,
    pending,
    refresh,
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

        if (isSelectedSafeLegacy.value) {
          message = await safe.value?.generateSignatureMessage(
            actualTx,
            +chainId.value,
            params?.options,
          )
        }
        else {
          message = await generateMultisigSignatureMessage({
            chainId: chainId.value,
            actions: actualTx,
            options: params?.options,
            metadata: params?.metadata,
            nonce: !isUndefined(params?.nonce) ? Number(params?.nonce) : undefined,
          })
        }

        const signatureParams = { message, targetChainId: chainId.value, safe: safeAddress.value, owner: selectedSafe.value?.owner_address || account.value }

        console.log({ message, signatureParams })

        if (!isSelectedSafeLegacy.value) {
          Object.assign(signatureParams, {
            index: String(selectedSafe.value?.multisig_index || 0),
          })
        }

        const signatureMethod = isSelectedSafeLegacy.value ? 'txn_estimateFeeWithoutSignature' : 'txn_multisigEstimateFeeWithoutSignature'

        const data = await avoProvider.send(signatureMethod, [
          signatureParams,
        ])

        return data
      }
      catch (err: any) {
        if (retry?.active === true && retry?.count?.value < retry?.max) {
          console.log('Fee estimation failed, retrying')
          retry.cb(retry.count, retry.max)
        }
        throw err?.error || err
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
    clearNuxtData(`estimated-fee-${chainId.value}`)
  })

  return {
    data,
    rawData,
    error: err,
    pending,
    refresh,
  }
}
