import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import collect from 'collect.js'
import { isAddress } from 'ethers/lib/utils'
import axios from 'axios'
import type { IToken } from './tokens'
import { getSafeOptionsByChain } from '~/server/utils/safe'
import type { TokenBalanceResolver } from '~/contracts'
import {
  Forwarder__factory,
  MultisigForwarder__factory,
  TokenBalanceResolver__factory,
} from '~/contracts'

export interface IBalance extends IToken {
  balance: string
  balanceInUSD: string | null
}

export const useSafe = defineStore('safe', () => {
  const balanceAborter = ref<AbortController>()
  const legacySafeAddress = ref()
  const safeAddress = ref()
  const mainSafeAddress = ref()
  const multiSigSafeAddress = ref()
  const accountSafeMapping = ref<Record<string, string>>({})
  const safeTotalBalanceMapping = ref<Record<string, string>>({})
  const route = useRoute()
  const ensName = ref()

  const safes = ref<ISafe[]>([])
  const safeOptions = ref<ISafeOptions[]>([])

  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()
  const legacySafe = ref<ISafe>()
  const multiSigSafe = ref<ISafe>()

  const availableSafeInstances = computed(() => {
    return [
      mainSafe.value,
      multiSigSafe.value,
      legacySafe.value,
    ].filter(Boolean) as ISafe[]
  })

  const safesLoading = ref(false)
  const optionsLoading = ref(false)

  const { account, connector } = useWeb3()
  const { tokens, customTokens } = storeToRefs(useTokens())
  const { fetchTokenByAddress } = useTokens()
  const documentVisibility = useDocumentVisibility()
  const { parseTransactionError } = useErrorHandler()
  const { getRpcProviderByChainId, getRpcBatchProviderByChainId } = useShared()
  const { trackingAccount } = useAccountTrack()

  const avoProvider = getRpcProviderByChainId(avoChainId)
  const avoBatchProvider = getRpcBatchProviderByChainId(avoChainId)

  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    getRpcBatchProviderByChainId(137),
  )

  const multisigForwarderProxyContract = MultisigForwarder__factory.connect(
    multisigForwarderProxyAddress,
    getRpcBatchProviderByChainId(137),
  )

  const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
    acc[curr.chainId] = TokenBalanceResolver__factory.connect(
      '0x3fb128aa5ac254c8539996b11c587e521ae0d3ab',
      getRpcProviderByChainId(curr.chainId),
    )
    return acc
  }, {} as Record<string, TokenBalanceResolver>)

  async function fetchComputedAddresses() {
    if (!account.value)
      return

    const polygonProvider = getRpcBatchProviderByChainId(137)

    const legacyProvider = Forwarder__factory.connect(
      forwarderProxyAddress,
      polygonProvider,
    )

    const multisigProvider = MultisigForwarder__factory.connect(
      multisigForwarderProxyAddress,
      polygonProvider,
    )

    const [oldSafeAddress, address, multisigAddress] = await Promise.all(
      [
        legacyProvider.computeAddress(
          account.value,
        ),
        multisigProvider.computeAvocado(
          account.value,
          0,
        ),
        multisigProvider.computeAvocado(
          account.value,
          1,
        ),
      ],
    )

    const cachedSafeAddress = accountSafeMapping.value[account.value]

    const [availableSafes, legacySafeInstance] = await Promise.all([
      getSafes(account.value),
      getSafe(oldSafeAddress),
    ])

    safes.value = availableSafes.data

    const isCachedSafeAvailable = availableSafes.data.some(i => isAddressEqual(cachedSafeAddress, i.safe_address))
      || isAddressEqual(cachedSafeAddress, multisigAddress)
      || isAddressEqual(cachedSafeAddress, address)

    if (address === incorrectAddress) {
      notify({
        type: 'error',
        message: 'Safe Address is not valid',
        duration: 15000,
      })
    }

    if (legacySafeInstance) {
      legacySafeAddress.value = oldSafeAddress
      legacySafe.value = legacySafeInstance
    }

    mainSafeAddress.value = address
    multiSigSafeAddress.value = multisigAddress
    safeAddress.value = isCachedSafeAvailable ? cachedSafeAddress : legacySafeInstance ? oldSafeAddress : address
  }

  async function fetchSafeInstanceses() {
    const [_selectedSafe, _mainSafe, _multisigSafe] = await Promise.all([
      getSafe(safeAddress.value),
      getSafe(mainSafeAddress.value),
      getSafe(multiSigSafeAddress.value),
    ])

    if (!_selectedSafe) {
      const isMultisig = isAddressEqual(safeAddress.value, multiSigSafeAddress.value)
      const isMainSafe = isAddressEqual(safeAddress.value, mainSafeAddress.value)

      selectedSafe.value = getDefaultSafe(safeAddress.value, 1, isMultisig ? 1 : isMainSafe ? 0 : undefined)
    }

    else { selectedSafe.value = _selectedSafe }

    if (!_mainSafe)
      mainSafe.value = getDefaultSafe(mainSafeAddress.value, 1)

    else
      mainSafe.value = _mainSafe

    if (!_multisigSafe)
      multiSigSafe.value = getDefaultSafe(multiSigSafeAddress.value, 1, 1)
    else
      multiSigSafe.value = _multisigSafe
  }

  const networkPreference = ref(
    availableNetworks.map(el => el.chainId),
  )

  const eoaBalances = ref<IBalance[]>()
  const balances = ref({
    data: undefined as IBalance[] | undefined,
    loading: false,
    error: null as Error | null,
  })

  const gasBalance = ref()

  const totalBalance = computed(() =>
    tokenBalances.value?.reduce(
      (acc, curr) => acc.plus(curr.balanceInUSD || '0'),
      toBN(0) || toBN(0),
    ),
  )

  const totalEoaBalance = computed(() => {
    return eoaBalances.value?.reduce(
      (acc, curr) => acc.plus(curr.balanceInUSD || '0'),
      toBN(0) || toBN(0),
    )
  },
  )

  const isSelectedSafeLegacy = computed(() => {
    return selectedSafe.value?.multisig === 0
  })

  const fundedEoaNetworks = computed(() => {
    return new Set(eoaBalances.value?.filter(item => toBN(item?.balance ?? 0).toNumber() !== 0).map(item => item.chainId.toString())).size
  })

  const getGasBalance = async (address: string) => {
    return avoProvider.getBalance(address)
  }

  const getSafe = async (address: string): Promise<ISafe> => {
    return avoBatchProvider.send('api_getSafe', [address])
  }

  function setSelectedSafe() {
    const availableSafe = availableSafeInstances.value.find(i => isAddressEqual(i.safe_address, safeAddress.value))
    const safe = safes.value.find(i => isAddressEqual(i.safe_address, safeAddress.value))

    if (availableSafe)
      selectedSafe.value = availableSafe

    else if (safe)
      selectedSafe.value = safe

    accountSafeMapping.value[account.value] = safeAddress.value
  }

  async function getChainBalances(chainId: string,
    address: string,
    tokens: string[] = []) {
    const newBalances: IBalance[] = []

    const chainTokenAddresses = collect(tokens)
      .chunk(chainId === '42161' ? 5 : 20)
      .all()

    await Promise.all(
      chainTokenAddresses.map(async (chunk: any[]) => {
        const addresses = (chunk as any).all()

        const [{ balances }, prices] = await Promise.all([
          balanceResolverContracts[chainId].callStatic.getBalances(
            address,
            addresses,
          ),
          fetchTokenByAddress(addresses, chainId),
        ])

        for (let index = 0; index < balances.length; index++) {
          const tokenAddress = addresses[index]
          const tokenPrice = prices.find(
            p => p.address.toLowerCase() === tokenAddress.toLowerCase(),
          )
          if (!tokenPrice)
            continue
          if (!balances[index].success)
            continue

          const balance = toBN(balances[index].balance).div(
            10 ** tokenPrice.decimals,
          )

          if (balance.gt(0)) {
            newBalances.push({
              name: tokenPrice.name,
              address: ethers.utils.getAddress(tokenPrice.address),
              decimals: tokenPrice.decimals,
              symbol: tokenPrice.symbol,
              logoURI: tokenPrice.logo_url,
              chainId: String(chainId),
              price: String(tokenPrice?.price || 0) as any,
              balance: balance.toFixed(6, 1),
              balanceInUSD: balance.times(tokenPrice?.price || 0).toFixed(2),
            } as any)
          }
        }
      }),
    )

    return newBalances
  }

  const tokenBalances = computed(() => {
    if (!safeAddress.value || !tokens.value?.length)
      return []

    return cloneDeep(tokens.value)
      .map((tb) => {
        const tokenBalance: IBalance = {
          ...tb,
          balance: '0',
          balanceInUSD: '0',
        }

        const currentBalances = balances.value.data || []

        const balance = currentBalances.find(
          (b: any) =>
            b.address.toLowerCase() === tb.address.toLowerCase()
            && tb.chainId == b.chainId,
        )

        if (balance) {
          tokenBalance.balance = balance.balance
          tokenBalance.balanceInUSD = toBN(tb.price || 0).gt(0)
            ? toBN(balance.balance)
              .times(tb.price || 0)
              .toFixed(2)
            : balance.balanceInUSD
        }

        return tokenBalance
      })
      .sort((a, b) =>
        toBN(b.balanceInUSD || 0)
          .minus(a.balanceInUSD || 0)
          .toNumber(),
      )
  })

  function updateBalances(data: IBalance[]) {
    for (const balance of data) {
      const currentBalances = balances.value.data || []

      let currentBalance = currentBalances.find(
        b =>
          b.address.toLowerCase() === balance.address.toLowerCase()
          && balance.chainId == b.chainId,
      )

      if (currentBalance) { currentBalance = balance }
      else {
        balances.value.data = balances.value.data || []
        balances.value.data.push(balance)
      }
    }
  }

  async function getBalances(address: string, signal?: AbortSignal, updateState = false) {
    return Promise.all(
      availableNetworks.map(async (network) => {
        const customTokenAddress = customTokens.value
          .filter(t => String(t.chainId) == String(network.chainId))
          .map(t => t.address)

        return getChainBalances(String(network.chainId), address, [
          ...tokens.value
            .filter(t => t.chainId == String(network.chainId))
            .map(t => t.address),
          ...customTokenAddress,
        ]).then((data) => {
          logBalance({ isPublic: true, chainId: network.chainId, isOnboard: !updateState })

          if (updateState)
            updateBalances(data)

          return data
        }).catch(async () => {
          try {
            const params: any = {
              userAddress: account.value,
              address,
              customTokens: customTokenAddress,
            }

            const data = await http(`/api/${network.chainId}/balances`, {
              signal,
              params,
            }) as IBalance[]

            logBalance({ isPublic: false, chainId: network.chainId, isOnboard: !updateState })

            if (updateState)
              updateBalances(data)

            return data
          }
          catch (error) {
            notify({
              type: 'warning',
              message: `Failed to fetch balances on ${chainIdToName(
                network.chainId,
              )}`,
            })
            return []
          }
        })
      }),
    )
  }

  const fetchBalances = async () => {
    if (!safeAddress.value)
      return
    if (!tokens.value.length)
      return
    if (documentVisibility.value === 'hidden')
      return

    if (safeAddress.value === incorrectAddress)
      return

    pause()

    try {
      balances.value.loading = true

      const data = await getBalances(
        safeAddress.value,
        balanceAborter.value?.signal,
        true,
      )

      balanceAborter.value = undefined

      balances.value.data = data
        .flat()
        .sort((a, b) => (toBN(a?.balanceInUSD || '0').gt(b?.balanceInUSD || '0') ? 1 : -1)) as IBalance[]

      balances.value.error = null

      const total = !data
        ? toBN('0')
        : data.flat().reduce(
          (acc, curr) => acc.plus(curr.balanceInUSD || '0'),
          toBN(0) || toBN(0),
        )

      // cache latest balances
      safeTotalBalanceMapping.value[safeAddress.value] = total.toFixed()

      return balances.value.data
    }
    catch (e: any) {
      const err = parseTransactionError(e)
      if (err?.parsed.includes('abort'))
        return

      balances.value.error = e
      throw e
    }
    finally {
      balances.value.loading = false
      resume()
    }
  }

  const debouncedFetchEoaBalances = useDebounceFn(fetchEoaBalances, 60000)

  async function fetchEoaBalances() {
    if (!account.value)
      return
    if (!tokens.value.length)
      return
    if (eoaBalances.value)
      return

    await until(selectedSafe).toMatch(s => !!s)
    await until(balances.value.loading).toMatch(s => !s)

    if (selectedSafe.value?.multisig === 1 && selectedSafe.value?.multisig_index > 0)
      return

    const resp = await getBalances(account.value)

    eoaBalances.value = resp.flat()
  }

  async function setGasBalance() {
    if (!safeAddress.value)
      return

    gasBalance.value = undefined

    const b = await getGasBalance(safeAddress.value).then(toBN)

    gasBalance.value = b.div(10 ** 18).toFixed()
  }

  const getSafes = async (address: string): Promise<ISafesResponse> => {
    return avoBatchProvider.send('api_getSafes', [{
      address,
    }])
  }

  async function getSafeOptions(safe: ISafe) {
    try {
      await until(balances.value.loading).toMatch(s => !s)

      const options = await Promise.all(
        availableNetworks.map((network) => {
          const provider = getRpcBatchProviderByChainId(network.chainId)

          return getSafeOptionsByChain(safe, network.chainId, provider).catch((e) => {
            const msg = 'Failed to get safe options by public provider'
            console.log(msg, e)

            const error = parseTransactionError(e)

            logActionToSlack({
              account: account.value,
              message: `${msg}: ${error.formatted}`,
              type: 'error',
              action: 'network',
            })

            return http(`/api/${network.chainId}/safes/${safe.safe_address}`, {
              params: {
                multisig_index: safe.multisig_index,
                multisig: safe.multisig,
                owner_address: safe.owner_address,
              },
            })
          })
        }),
      )

      return options as ISafeOptions[]
    }
    catch (e: any) {
      const msg = 'Failed to get safe options over public and private provider'
      console.log(msg, e)
      const error = parseTransactionError(e)

      logActionToSlack({
        account: account.value,
        message: `${msg}: ${error.formatted}`,
        type: 'error',
        action: 'network',
      })
    }
  }

  const setMultisigParamSafe = async () => {
    const paramSafe = route.params.safe as string

    if (!paramSafe)
      return

    if (!isAddress(paramSafe))
      return

    // check if paramSafe is a valid multisig safe
    const isValidMultiSigSafe = !!safes.value.find(
      safe => isAddressEqual(safe.safe_address, paramSafe),
    ) || isAddressEqual(multiSigSafeAddress.value, paramSafe)

    if (!isValidMultiSigSafe)
      return

    safeAddress.value = paramSafe
  }

  const resetAccounts = () => {
    trackingAccount.value = ''

    safeAddress.value = undefined
    mainSafeAddress.value = undefined
    legacySafeAddress.value = undefined
  }

  function getDefaultSafe(address: string, multisig: 0 | 1 = 0, multisig_index = 0): ISafe {
    return {
      safe_address: address,
      authorities: {},
      created_at: new Date().toString(),
      deployed: {},
      fully_deployed: 0,
      id: 0,
      owner_address: account.value,
      updated_at: new Date().toString(),
      version: {},
      multisig,
      signers: {},
      multisig_index,
    }
  }

  async function fetchPendingMultisigTxnsCount(multiSigAddress: string): Promise<number | undefined> {
    try {
      const resp = await axios.get(`/safes/${multiSigAddress}/transactions`, {
        params: {
          status: 'pending',
        },
        baseURL: multisigURL,
      })
      const txs: IMultisigTransactionResponse = resp.data
      return txs.meta.total
    }
    catch (e: any) {
      handleAxiosError(e, false)
    }
  }

  useIntervalFn(setGasBalance, 15000, {
    immediate: false,
  })

  const { pause, resume } = useIntervalFn(fetchBalances, 15000)

  watchDebounced(selectedSafe, async () => {
    if (!selectedSafe.value)
      return

    try {
      optionsLoading.value = true

      const opts = await getSafeOptions(selectedSafe.value)

      console.log(opts)

      if (opts)
        safeOptions.value = opts
    }
    finally {
      optionsLoading.value = false
    }
  }, {
    debounce: 2800,
  })

  watchThrottled(
    account,
    async () => {
      if (!account.value)
        return

      try {
        safesLoading.value = true

        await fetchComputedAddresses()

        await fetchSafeInstanceses()

        setMultisigParamSafe()

        safesLoading.value = false
      }
      catch (e: any) {
        const error = parseTransactionError(e)
        logActionToSlack({
          account: account.value,
          action: 'network',
          message: `Failed to computed safes: ${error.formatted}`,
          type: 'error',
        })
      }
    },
    { throttle: 500 },
  )

  watchThrottled(safeAddress, async () => {
    balances.value.data = undefined

    await until(tokens).toMatch(t => t.length > 0)
    fetchBalances()

    debouncedFetchEoaBalances()
  }, {
    throttle: 500,
  })

  watchThrottled(safeAddress, async () => {
    if (!safeAddress.value)
      return

    setSelectedSafe()
    setGasBalance()
  }, {
    throttle: 500,
  })

  watchThrottled(account, async () => {
    if (!account.value)
      return

    ensName.value = await getRpcProviderByChainId(1).lookupAddress(account.value)
  }, {
    throttle: 1000,
  })

  watchThrottled(connector, () => {
    if (!connector.value)
      return
    connector.value.on('Web3ReactUpdate', async (params) => {
      // only reset accounts if account changed
      if (params?.account) {
        resetAccounts()

        // if safepal available, tricky way to update account
        if (window.ethereum.isSafePal) {
          account.value = ''
          await new Promise(resolve => setTimeout(resolve, 1))
          account.value = params.account
        }
      }
    })
  }, {
    immediate: true,
    throttle: 500,
  })

  onBeforeUnmount(() => {
    if (connector.value)
      connector.value.off('Web3ReactUpdate', () => {})
  })

  return {
    safeAddress,
    mainSafeAddress,
    multiSigSafeAddress,
    multiSigSafe,
    mainSafe,
    selectedSafe,
    safes,
    gasBalance,
    tokenBalances,
    totalBalance,
    setGasBalance,
    balances,
    eoaBalances,
    totalEoaBalance,
    fetchBalances,
    forwarderProxyAddress,
    networkPreference,
    avoProvider,
    getBalances,
    fundedEoaNetworks,
    forwarderProxyContract,
    resetAccounts,
    multisigForwarderProxyContract,
    setSelectedSafe,
    accountSafeMapping,
    safeTotalBalanceMapping,
    getSafe,
    fetchPendingMultisigTxnsCount,
    legacySafe,
    legacySafeAddress,
    getSafes,
    isSelectedSafeLegacy,
    safesLoading,
    ensName,
    safeOptions,
    getSafeOptions,
    optionsLoading,
  }
}, {
  persist: {
    paths: ['accountSafeMapping', 'safeTotalBalanceMapping'],
    storage: persistedState.cookiesWithOptions({
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 10),
    }),
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot))
