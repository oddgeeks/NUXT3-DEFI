import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import collect from 'collect.js'
import { deepCopy, isAddress } from 'ethers/lib/utils'
import axios from 'axios'
import { wait } from '@instadapp/utils'
import type { IToken } from './tokens'
import { getComputedAddresses, getSafeOptionsByChain } from '~/server/utils/safe'
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
  const accountSafeMapping = useCookie<Record<string, string>>('account-safe-mapping', {
    maxAge: 60 * 60 * 24 * 365 * 10,
  })
  const safeTotalBalanceMapping = useCookie<Record<string, string>>('safe-balance-mapping', {
    maxAge: 60 * 60 * 24 * 365 * 10,
  })

  const route = useRoute()
  const ensName = ref()

  const safes = ref<ISafe[]>([])
  const safeOptions = ref<ISafeOptions[]>([])

  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()
  const legacySafe = ref<ISafe>()
  const multiSigSafe = ref<ISafe>()

  const safesLoading = ref(false)
  const optionsLoading = ref(false)

  const { account } = useWeb3()
  const { tokens, customTokens } = storeToRefs(useTokens())
  const { fetchTokenByAddress } = useTokens()
  const documentVisibility = useDocumentVisibility()
  const { parseTransactionError } = useErrorHandler()
  const { getRpcProviderByChainId, getRpcBatchProviderByChainId, getRpcBatchRetryProviderByChainId } = useShared()
  const { trackingAccount } = useAccountTrack()

  const avoProvider = getRpcProviderByChainId(avoChainId)
  const avoBatchProvider = getRpcBatchRetryProviderByChainId(avoChainId)

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

  async function computeAddresses() {
    try {
      const polygonProvider = getRpcBatchProviderByChainId(137)
      const { address, multisigAddress, oldSafeAddress } = await getComputedAddresses(polygonProvider, account.value)

      logBalance({
        chainId: 137,
        type: 'compute',
        isPublic: true,
      })

      return {
        address,
        multisigAddress,
        oldSafeAddress,
      }
    }
    catch (e) {
      const { address, multisigAddress, oldSafeAddress } = await http<IComputeAddresses>('/api/rpc/compute', {
        params: {
          address: account.value,
        },
        retry: 3,
      })

      logBalance({
        chainId: 137,
        type: 'compute',
        isPublic: false,
      })

      return {
        address,
        multisigAddress,
        oldSafeAddress,
      }
    }
  }

  const getCachedSafeAddress = (eoa: string) => {
    try {
      const cachedSafeAddress = accountSafeMapping.value[eoa]

      return cachedSafeAddress
    }
    catch {
      return undefined
    }
  }

  async function fetchComputedAddresses() {
    if (!account.value)
      return

    const { address, multisigAddress, oldSafeAddress } = await computeAddresses()

    const cachedSafeAddress = getCachedSafeAddress(account.value)

    console.log({ cachedSafeAddress })

    const [availableSafes, legacySafeInstance] = await Promise.all([
      getSafes(account.value),
      getSafe(oldSafeAddress),
    ])

    safes.value = availableSafes.data

    const isCachedSafeAvailable = availableSafes.data.some(i => isAddressEqual(cachedSafeAddress, i.safe_address))
      || isAddressEqual(cachedSafeAddress, multisigAddress)
      || isAddressEqual(cachedSafeAddress, address)
      || isAddressEqual(cachedSafeAddress, oldSafeAddress)

    if (address === incorrectAddress) {
      notify({
        type: 'error',
        message: 'Safe Address is not valid',
        duration: 15000,
      })
    }

    legacySafeAddress.value = oldSafeAddress
    legacySafe.value = legacySafeInstance || getDefaultSafe(oldSafeAddress, 0)
    mainSafeAddress.value = address
    multiSigSafeAddress.value = multisigAddress

    const setLegacyAsDefault = await legacySafeAsDefault(oldSafeAddress, legacySafeInstance)

    const paramSafe = route.params?.safe as string

    const isParamSafeValid = paramSafe && isAddress(paramSafe)

    const isParamSafeAvailable = isParamSafeValid
      ? isAddressEqual(paramSafe, multisigAddress)
      || safes.value.some(i => i.multisig === 1 && isAddressEqual(paramSafe, i.safe_address))
      : false

    safeAddress.value = isParamSafeAvailable
      ? paramSafe
      : isCachedSafeAvailable
        ? cachedSafeAddress
        : setLegacyAsDefault
          ? oldSafeAddress
          : address
  }

  // If legacy safe exists and has gas set it as default
  // If legacy safe is default, set the hide-legacy-safe to false
  async function legacySafeAsDefault(oldSafeAddress?: string, legacySafeInstance?: ISafe) {
    if (oldSafeAddress) {
      const legacySafeHasGas = await getGasBalance(oldSafeAddress).then(toBN).then(b => b.gt(0))
      const setLegacyAsDefault = legacySafeInstance && legacySafeHasGas
      const hideLegacySafe = useLocalStorage('hide-legacy-safe', !legacySafeHasGas)
      hideLegacySafe.value = !setLegacyAsDefault
      return setLegacyAsDefault
    }
    return false
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

  const networkOrderedBySumTokens = computed(() => {
    const networks = deepCopy(availableNetworks)
    const sortedBySumTokens = networks.map((network) => {
      const balanceInNetwork = balances.value.data?.reduce(
        (acc, curr) => {
          if (curr.chainId === network.chainId.toString())
            return acc.plus(curr.balanceInUSD || '0')
          return acc
        }, toBN(0)) || toBN(0)

      return {
        ...network,
        sumBalanceInUsd: balanceInNetwork.toString(),
      }
    })
      .sort((a, b) => {
        return toBN(b.sumBalanceInUsd).minus(a.sumBalanceInUsd).toNumber()
      })
    return sortedBySumTokens
  })

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

  async function refreshSelectedSafe() {
    if (!safeAddress.value)
      return

    const safe = await getSafe(safeAddress.value)

    if (safe)
      selectedSafe.value = safe
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
          logBalance({ isPublic: true, chainId: network.chainId, type: !updateState ? 'eoa-balances' : 'safe-balances' })

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

            logBalance({ isPublic: false, chainId: network.chainId, type: !updateState ? 'eoa-balances' : 'safe-balances' })

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
      await until(optionsLoading).toMatch(s => !s)

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

      const clonedSafeTotalBalanceMapping = cloneDeep(safeTotalBalanceMapping.value || {})

      clonedSafeTotalBalanceMapping[safeAddress.value] = total.toFixed()

      safeTotalBalanceMapping.value = clonedSafeTotalBalanceMapping

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

  async function fetchEoaBalances() {
    if (!account.value)
      return
    if (!tokens.value.length)
      return
    if (eoaBalances.value)
      return

    await until(selectedSafe).toMatch(s => !!s)
    await until(() => balances.value.loading).toMatch(s => !s)
    await wait(1000)

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

  async function getSafeOptionsFromServer(safe: ISafe) {
    return Promise.all(
      availableNetworks.map((network) => {
        return http(`/api/${network.chainId}/safes/${safe.safe_address}`, {
          params: {
            multisig_index: safe.multisig_index,
            multisig: safe.multisig,
            owner_address: safe.owner_address,
          },
        }).then((e) => {
          logBalance({
            chainId: network.chainId,
            type: 'options',
            isPublic: false,
          })
          return e
        })
      }),
    )
  }

  async function getFallbackSafeOptionsByChainId(safe: ISafe, chainId: number | string): Promise<ISafeOptions> {
    try {
      const config = await getSafeOptionsByChain(safe, chainId, getRpcBatchProviderByChainId(chainId))
      return config
    }
    catch (e) {
      const config = await http(`/api/${chainId}/safes/${safe.safe_address}`, {
        params: {
          multisig_index: safe.multisig_index,
          multisig: safe.multisig,
          owner_address: safe.owner_address,
        },
      })

      return config
    }
  }

  async function getSafeOptions(safe: ISafe) {
    try {
      await until(() => balances.value.loading).toMatch(s => !s)

      const options = await Promise.all(
        availableNetworks.map((network) => {
          const provider = getRpcBatchProviderByChainId(network.chainId)

          return getSafeOptionsByChain(safe, network.chainId, provider)
            .catch((e) => {
              const msg = 'Failed to get safe options by public provider'

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
            .then((e) => {
              logBalance({
                chainId: network.chainId,
                type: 'options',
                isPublic: !e?.server,
              })
              return e
            })
        }),
      )

      return options as ISafeOptions[]
    }
    catch (e: any) {
      const msg = 'Failed to get safe options over public and private provider'
      const error = parseTransactionError(e)

      logActionToSlack({
        account: account.value,
        message: `${msg}: ${error.formatted}`,
        type: 'error',
        action: 'network',
      })

      return getSafeOptionsFromServer(safe)
    }
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
    debounce: 1500,
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
  }, {
    throttle: 500,
  })

  watchThrottled(safeAddress, async () => {
    if (!safeAddress.value)
      return

    setGasBalance()
    const cloneMapped = cloneDeep(accountSafeMapping.value || {})

    cloneMapped[account.value] = safeAddress.value

    accountSafeMapping.value = cloneMapped
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

  const fetchDebouncedEOABalance = useDebounceFn(fetchEoaBalances, 60000)

  watchThrottled(account, () => {
    eoaBalances.value = undefined

    fetchDebouncedEOABalance()
  }, {
    throttle: 1000,
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
    refreshSelectedSafe,
    networkOrderedBySumTokens,
    getFallbackSafeOptionsByChainId,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot))
