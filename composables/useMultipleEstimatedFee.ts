export function useMultipleEstimatedFee(
  actions: Ref<IEstimatedActions[]>,
) {
  const { avoProvider } = useSafe()
  const { account } = useWeb3()
  const { generateMultisigSignatureMessage, generateSignatureMessage } = useAvocadoSafe()
  const { gasBalance, safeAddress, selectedSafe, isSelectedSafeLegacy } = storeToRefs(useSafe())
  const { parseTransactionError } = useErrorHandler()

  const rawData = ref<IEstimatedFeeDataWithChainId[]>()
  const pending = ref(false)
  const error = ref()

  const data = computed(() => {
    if (!rawData.value)
      return

    return rawData.value?.map((item) => {
      const discountDetails: DiscountDetails = {
        name: item.discount?.name || '',
        amount: item.discount?.amount || 0,
        description: item.discount?.description || '',
      }

      const isDiscountAvailable = !!item?.discount?.name

      return calculateEstimatedFee({
        chainId: item.chainId,
        fee: item.fee,
        multiplier: item.multiplier,
        discountDetails: isDiscountAvailable ? [discountDetails] : [],
      })
    })
  })

  const totalAmountAfterDiscount = computed(() => {
    if (!data.value)
      return

    return data.value?.reduce((acc, item) => {
      return acc.plus(item.amountAfterDiscount)
    }, toBN(0))
  })

  const err = computed(() => {
    const message = 'Something went wrong. Please try again!'
    if (pending.value)
      return
    if (error.value) {
      const formatted = parseTransactionError(error.value)?.formatted

      return formatted || message
    }

    if (toBN(gasBalance.value).lt(totalAmountAfterDiscount.value || '0'))
      return 'Not enough USDC gas'

    if (toBN(gasBalance.value).lt(toBN(totalAmountAfterDiscount.value || '0').times(1.1)))
      return 'Estimated gas and current balance are very close, due to market fluctuation tx might fail.'
  })

  watchThrottled(actions, () => {
    fetchEstimatedFee()
  }, {
    immediate: true,
    throttle: 500,
    deep: true,
  })

  async function fetchEstimatedFee() {
    try {
      if (!actions.value?.length)
        return

      pending.value = true
      error.value = undefined

      const resp = await Promise.allSettled(actions.value.map(async (action) => {
        let message

        if (isSelectedSafeLegacy.value) {
          message = await generateSignatureMessage({
            actions: action.actions,
            chainId: action.chainId,
            options: action.options,
          })
        }
        else {
          message = await generateMultisigSignatureMessage({
            chainId: action.chainId,
            actions: action.actions,
            options: action.options,
            metadata: action.options?.metadata || '0x',
          })
        }

        const signatureParams = {
          message,
          targetChainId: action.chainId,
          safe: safeAddress.value,
          owner: selectedSafe.value?.owner_address || account.value,
        }

        if (!isSelectedSafeLegacy.value) {
          Object.assign(signatureParams, {
            index: String(selectedSafe.value?.multisig_index || 0),
          })
        }

        const signatureMethod = isSelectedSafeLegacy.value ? 'txn_estimateFeeWithoutSignature' : 'txn_multisigEstimateFeeWithoutSignature'

        const data = await avoProvider.send(signatureMethod, [
          signatureParams,
        ])

        data.chainId = action.chainId

        return data
      }))

      rawData.value = resp
        .filter(i => i.status === 'fulfilled')
        .map(i => i.status === 'fulfilled' ? i.value : undefined)

      const errors = resp.filter(i => i.status === 'rejected')
        .map(i => i.status === 'rejected' && i.reason)

      if (errors.length) {
        error.value = errors.map((err: any) => {
          return `${chainIdToName(err.chainId)} : ${parseTransactionError(err)?.formatted || err?.error || err}`
        }).join('\n')
      }
    }
    catch (err: any) {
      error.value = err?.error || err
    }
    finally {
      pending.value = false
    }
  }

  return {
    data,
    rawData,
    error: err,
    pending,
    refresh: fetchEstimatedFee,
    totalAmountAfterDiscount,
  }
}
