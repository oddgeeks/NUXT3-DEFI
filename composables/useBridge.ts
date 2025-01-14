import { useField, useForm } from 'vee-validate'
import * as yup from 'yup'

import Fuse from 'fuse.js'
import { getAddress } from 'ethers/lib/utils'
import type { IToken } from '~~/stores/tokens'
import type { IBalance } from '~~/stores/safe'
import { Erc20__factory } from '~~/contracts'

interface IFee {
  amount: string
  feesInUsd: string
  asset: IToken
}

export function useBridge(fromToken: Ref<IBalance>, fromChainId: Ref<string>) {
  let txController: AbortController | null = null
  let tokensController: AbortController | null = null
  let fromController: AbortController | null = null
  let routesController: AbortController | null = null

  const { isInputUsd } = useInputUsd()
  const [max, toggleMax] = useToggle(false)
  const [dirty, toggleDirty] = useToggle(false)

  const { account } = useWeb3()
  const { fromWei, toWei } = useBignumber()
  const { tokenBalances, safeAddress } = useAvocadoSafe()
  const { tokens } = storeToRefs(useTokens())
  const { getRpcProviderByChainId } = useShared()
  const { authorisedNetworks } = useAuthorities()

  const toChainId = ref(fromChainId.value == '137' ? '10' : '137')
  const bridgeToToken = ref<IBridgeTokensResult>()
  const txRoute = ref<IRoute>()

  const form = useForm({
    validationSchema: yup.object({
      amount: yup
        .string()
        .required('')
        .test('min-amount', '', (value: any) => {
          const amount = toBN(value)

          return value ? amount.gt(0) : true
        })
        .test('max-amount', 'Insufficient balance', (value: any) => {
          const amount = toBN(value)
          const balance = toBN(fromToken.value.balance)

          return amount.gt(0) ? amount.lte(balance) : true
        }),
    }),
  })

  const { value: amount, setValue } = useField<string>('amount')

  const amountInUsd = computed({
    get() {
      return toBN(fromToken.value?.price || 0)
        .times(amount.value || 0)
        .decimalPlaces(4, 6).toNumber()
    },
    set(newValue) {
      if (max.value)
        return

      const value = toBN(newValue || 0).div(fromToken.value?.price || 0)

      setValue(toBN(value)
        .decimalPlaces(4, 6)
        .toString(), true)
    },
  })

  const nativeCurrency = computed(() => {
    const nativeTokenMeta = getNetworkByChainId(+fromChainId.value).params
      .nativeCurrency

    return tokens.value.find(
      t =>
        t.chainId == fromChainId.value
        && t.symbol.toLowerCase() === nativeTokenMeta?.symbol?.toLowerCase(),
    )
  })

  const toAmount = computed(() =>
    formatDecimal(
      fromWei(
        txRoute.value?.toAmount || '0',
        bridgeToToken?.value?.decimals,
      ).toFixed(),
    ),
  )

  const recivedValueInUsd = computed(() => {
    return toBN(recievedAmount.value).times(bridgeToToken.value?.price || '0')
  },
  )

  const recievedAmount = computed(() =>
    fromWei(txRoute?.value?.toAmount || '0', bridgeToToken?.value?.decimals)
      .toFixed(),
  )

  const bridgeTokens = useAsyncData(
    'bridge-to-tokens',
    async () => {
      try {
        if (tokensController)
          tokensController.abort()

        tokensController = new AbortController()

        const { result }: IBridgeTokensResponse = await http(
          '/api/socket/v2/token-lists/to-token-list',
          {
            signal: tokensController.signal,
            params: {
              fromChainId: fromChainId.value,
              toChainId: toChainId.value,
              isShortList: true,
            },
          },
        )

        tokensController = null

        const sorted = sortTokensBestMatch(result, fromToken.value.symbol)

        if (sorted.length) {
          const [token] = sorted

          bridgeToToken.value = token
        }

        return sorted
      }
      catch (e) {
      }
    },
    {
      server: false,
      immediate: true,
      default: () => [],
      watch: [fromChainId, toChainId],
    },
  )

  const fromTokens = useAsyncData(
    'bridge-from-tokens',
    async () => {
      try {
        if (fromController)
          fromController.abort()

        fromController = new AbortController()

        const { result }: IBridgeTokensResponse = await http(
          '/api/socket/v2/token-lists/from-token-list',
          {
            signal: fromController.signal,
            params: {
              fromChainId: fromChainId.value,
              toChainId: toChainId.value,
            },
          },
        )

        fromController = null

        return result
      }
      catch (e) {
      }
    },
    {
      server: false,
      immediate: true,
      lazy: true,
      watch: [fromChainId, toChainId],
    },
  )

  const quote = useAsyncData(
    'bridge-quote',
    async () => {
      const { valid } = await form.validate()

      if (!valid)
        return

      if (!bridgeToToken.value) {
        if (bridgeTokens.data.value?.length) {
          throw new Error('No bridge token found', {
            cause: 'no-bridge-token',
          })
        }
        else { return }
      }

      const transferAmount = toWei(
        amount.value || '0',
        fromToken.value.decimals,
      )

      try {
        if (routesController)
          routesController.abort()

        routesController = new AbortController()

        const data: IBridgeResponse = await http('/api/socket/v2/quote', {
          signal: routesController.signal,
          params: {
            fromTokenAddress: fromToken.value.address,
            fromChainId: fromChainId.value,
            toChainId: toChainId.value,
            toTokenAddress: bridgeToToken.value.address,
            fromAmount: transferAmount,
            userAddress: safeAddress.value,
            recipient: safeAddress.value,
            singleTxOnly: true,
            bridgeWithGas: false,
            bridgeWithInsurance: true,
            defaultSwapSlippage: 1,
            sort: 'output',
            isContractCall: true,
          },
        })

        routesController = null

        if (!data.result?.routes?.length) {
          const minAmountError: any = Object.entries(data.result.bridgeRouteErrors).find(([_, error]: any) => {
            return error?.status === 'MIN_AMOUNT_NOT_MET'
          })

          if (minAmountError) {
            const [_, error] = minAmountError

            const minAmountLabel = `${fromWei(error.minAmount, fromToken.value.decimals)} ${fromToken.value.symbol.toUpperCase()}`

            if (!form.errors.value.amount)
              form.setFieldError('amount', `Minimum bridge amount is ${error?.minAmount ? minAmountLabel : 'not met'}`)
          }
          else {
            throw new Error(
              'Our bridge provider does not have routes for your desired transfer',
              {
                cause: 'no-routes',
              },
            )
          }
        }

        data?.result?.routes.sort((a, b) => toBN(b?.toAmount || '0').minus(toBN(a?.toAmount || '0')).toNumber())

        const [route] = data?.result?.routes || []

        txRoute.value = route

        return data
      }
      catch (error: any) {
        throw new Error(
          error.cause
            ? error.message
            : 'Unexpected error, please try again later',
        )
      }
    },
    {
      server: false,
      immediate: false,
      lazy: true,
      watch: [amount, fromToken, bridgeToToken],
    },
  )

  const transactions = useAsyncData(
    'bridge-transactions',
    async () => {
      const txs = []

      if (!txRoute.value)
        return

      for (const userTx of txRoute.value?.userTxs || []) {
        if (userTx.approvalData) {
          const erc20 = Erc20__factory.connect(
            fromToken.value.address,
            getRpcProviderByChainId(fromChainId.value),
          )
          const { data } = await erc20.populateTransaction.approve(
            userTx.approvalData.allowanceTarget,
            userTx.approvalData.minimumApprovalAmount,
          )

          txs.push({
            to: fromToken.value.address,
            data,
          })
        }
      }

      if (txController)
        txController.abort()

      txController = new AbortController()

      const buildTx = await http('/api/socket/v2/build-tx', {
        signal: txController.signal,
        method: 'POST',
        body: {
          route: txRoute.value,
        },
      })

      txController = null

      txs.push({
        to: buildTx.result.txTarget,
        data: buildTx.result.txData,
        value: buildTx.result.value,
      })

      return txs
    },
    {
      watch: [txRoute],
      server: false,
      lazy: true,
    },
  )

  const nativeFee = computed(() => {
    let v
      = transactions.data.value?.reduce((acc: any, tx: any) => {
        return toBN(acc)
          .plus(fromWei(tx?.value || '0', nativeCurrency.value?.decimals))
          .toFixed()
      }, '0') || '0'

    if (
      fromToken.value.address === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    ) {
      v = toBN(v)
        .minus(amount.value || '0')
        .toFixed(0)
    }

    return v
  })

  const nativeFeeInUsd = computed(() =>
    times(nativeFee.value!, nativeCurrency.value?.price || 0),
  )

  const priceImpact = computed(() => toBN(amountInUsd.value || '0').minus(recivedValueInUsd.value || '0').div(amountInUsd.value).times(100).toFixed())

  const isPriceImpactHigh = computed(() => {
    if (!amountInUsd.value || !txRoute.value)
      return false

    return toBN(priceImpact.value).gt(40)
  })

  const isInsufficientBalance = computed(() => {
    const nativeBalance
      = tokenBalances.value.find(
        t =>
          t.chainId == fromToken.value.chainId
          && t.symbol === nativeCurrency.value?.symbol,
      )?.balance || '0'

    return toBN(nativeBalance).lt(nativeFee.value!)
  })

  const bridgeFee = computed<IFee>(() => {
    const fallback: IFee = {
      amount: '0',
      feesInUsd: '0',
      asset: nativeCurrency.value as IToken,
    }

    if (!txRoute.value)
      return fallback

    const fees = txRoute.value?.userTxs.reduce((acc: IFee, tx: any) => {
      const bridgeFee = tx.steps.reduce((acc: any, step: any) => {
        if (!step?.protocolFees)
          return acc

        const asset = step?.protocolFees?.asset
        const assetPrice = tokenBalances.value.find(
          i => i.address.toLowerCase() === asset?.address.toLowerCase(),
        )

        const amount = fromWei(
          toBN(acc.amount || '0').plus(toBN(step?.protocolFees?.amount || '0')),
          step?.protocolFees?.asset?.decimals,
        )

        return {
          amount: amount.toFixed(),
          feesInUsd: toBN(acc.feesInUsd || '0')
            .plus(amount.times(assetPrice?.price || 0))
            .toFixed(),
          asset: step?.protocolFees?.asset,
        }
      }, fallback)

      return {
        amount: toBN(bridgeFee.amount)
          .plus(toBN(acc.amount || '0'))
          .toFixed(),
        feesInUsd: toBN(bridgeFee.feesInUsd)
          .plus(toBN(acc.feesInUsd || '0'))
          .toFixed(),
        asset: bridgeFee.asset,
      }
    }, fallback)

    return fees
  })

  const handleSwapToken = () => {
    const balancedToken = tokenBalances.value.find(
      t =>
        gt(t.balance, '0')
        && t.chainId == fromChainId.value
        && t.symbol !== nativeCurrency.value?.symbol,
    )

    const fallbackToken = tokens.value.find(
      i => i.chainId == fromChainId.value,
    )
    const isSameToken
      = fromToken.value?.symbol.toLowerCase()
      === nativeCurrency.value?.symbol.toLowerCase()

    const fromAddress = !isSameToken
      ? fromToken.value
      : balancedToken || fallbackToken

    const fromAmount = toBN(nativeFee.value)
      .times(nativeCurrency.value?.price || '0')
      .div(fromAddress?.price || '0')
      .toFixed(5)

    openSwapModal(
      fromAddress?.address!,
      fromChainId.value,
      nativeCurrency.value?.address!,
      fromAmount,
    )
  }

  function sortTokensBestMatch(list: IBridgeTokensResult[] | IBalance[] | any[], search: string) {
    const fuse = new Fuse(list, {
      keys: ['symbol', 'name'],
      threshold: 0.3,
      shouldSort: true,
      includeScore: true,
    })

    const sortedByMatch = fuse.search(search)

    const sortedByBalance = list.map((token) => {
      const internalToken = tokenBalances.value.find(
        i =>
          getAddress(i.address) === getAddress(token.address)
          && String(i.chainId) == String(token.chainId),
      )

      token.balance = internalToken?.balance || '0'
      token.price = internalToken?.price || 0

      const matched = sortedByMatch.find(
        i => i.item.symbol === token.symbol,
      )

      token.score = matched?.score

      return token
    })
      .sort((a, b) => toBN(b.balance || 0).minus(a.balance || 0).toNumber())
      .filter(i => !i.score)

    const finalList = [
      ...sortedByMatch.map(i => i.item),
      ...sortedByBalance,
    ]

    // filter tokens that are not in the Avocado Tokens
    return finalList.filter((i) => {
      const token = tokens.value.find(
        t =>
          getAddress(t.address) === getAddress(i.address)
          && String(t.chainId) == String(i.chainId),
      )

      return !!token
    })
  }

  const selectableToChains = computed(() =>
    authorisedNetworks.value.filter(
      c =>
        String(c.chainId) !== fromChainId.value
        && !bridgeDisabledChains.some(i => String(i) == String(c.chainId)),
    ),
  )

  const disabled = computed(
    () =>
      !fromToken.value
      || !account.value
      || bridgeTokens.pending.value
      || !txRoute.value
      || !form.meta.value.valid
      || !!transactions.error.value
      || loading.value
      || !!quote.error.value?.message
      || isInsufficientBalance.value,
  )

  const loading = computed(
    () =>
      form.isSubmitting.value
      || quote.pending.value
      || transactions.pending.value
      || bridgeTokens.pending.value,
  )

  function clearData() {
    bridgeToToken.value = undefined
    txRoute.value = undefined

    clearNuxtData('bridge-transactions')
    clearNuxtData('bridge-quote')
    clearNuxtData('bridge-to-tokens')
    clearNuxtData('bridge-from-tokens')
  }

  onMounted(() => {
    const firstSelectableChain = selectableToChains.value[0]

    if (firstSelectableChain)
      toChainId.value = String(firstSelectableChain.chainId)
  })

  watch([fromChainId, toChainId], () => {
    clearData()
  })

  onUnmounted(() => {
    clearData()

    // abort controllers if they are still running
    const controllers = [txController, tokensController, fromController, routesController]

    controllers.forEach((controller) => {
      if (controller) {
        controller.abort()
        controller = null
      }
    })
  })

  return {
    amount,
    toAmount,
    toChainId,
    fromChainId,
    bridgeToToken,
    quote,
    txRoute,
    form,
    bridgeFee,
    disabled,
    loading,
    nativeCurrency,
    transactions,
    nativeFee,
    nativeFeeInUsd,
    isInsufficientBalance,
    selectableToChains,
    handleSwapToken,
    recivedValueInUsd,
    recievedAmount,
    bridgeTokens,
    fromTokens,
    sortTokensBestMatch,
    amountInUsd,
    isInputUsd,
    max,
    toggleMax,
    dirty,
    toggleDirty,
    isPriceImpactHigh,
    priceImpact,
  }
}
