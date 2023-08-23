import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import collect from 'collect.js'
import type { IToken } from './tokens'
import type { TokenBalanceResolver } from '~/contracts'
import {
  Forwarder__factory,
  GaslessWallet__factory,
  TokenBalanceResolver__factory,
} from '~/contracts'

export interface IBalance extends IToken {
  balance: string
  balanceInUSD: string | null
}

export const useSafe = defineStore('safe', () => {
  const balanceAborter = ref<AbortController>()
  const safeAddress = ref()

  const { account } = useWeb3()
  const { tokens, customTokens } = storeToRefs(useTokens())
  const { fetchTokenByAddress } = useTokens()
  const documentVisibility = useDocumentVisibility()
  const { parseTransactionError } = useErrorHandler()
  const { getRpcProviderByChainId } = useShared()

  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    getRpcProviderByChainId(137),
  )

  const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
    acc[curr.chainId] = TokenBalanceResolver__factory.connect(
      '0x3fb128aa5ac254c8539996b11c587e521ae0d3ab',
      getRpcProviderByChainId(curr.chainId),
    )
    return acc
  }, {} as Record<string, TokenBalanceResolver>)

  const avoProvider = getRpcProviderByChainId(avoChainId)

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
  const pending = ref<Record<string, boolean>>({
    gasBalance: false,
    global: false,
  })

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

  const fundedEoaNetworks = computed(() => {
    return new Set(eoaBalances.value?.filter(item => toBN(item?.balance ?? 0).toNumber() !== 0).map(item => item.chainId.toString())).size
  })

  const fetchSafeAddress = async () => {
    if (!account.value) {
      safeAddress.value = undefined
      return
    }

    const address = await forwarderProxyContract.computeAddress(
      account.value,
    )

    if (address === incorrectAddress) {
      notify({
        type: 'error',
        message: 'Safe Address is not valid',
        duration: 15000,
      })
    }

    safeAddress.value = address
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

  const networkVersions = useAsyncData(
    'allNetworkVersions',
    async () => {
      if (!safeAddress.value)
        return

      const promises = availableNetworks.map(async (network) => {
        const obj = {
          ...network,
        } as NetworkVersion

        try {
          const wallet = GaslessWallet__factory.connect(
            safeAddress.value,
            getRpcProviderByChainId(network.chainId),
          )

          const forwarderProxyContract = Forwarder__factory.connect(
            forwarderProxyAddress,
            getRpcProviderByChainId(network.chainId),
          )

          const latestVersion = await forwarderProxyContract.avoWalletVersion(
            '0x0000000000000000000000000000000000000001',
          )

          try {
            const currentVersion = await wallet.DOMAIN_SEPARATOR_VERSION()
            obj.currentVersion = currentVersion
          }
          catch (e) {
            obj.notdeployed = true
            obj.currentVersion = '0.0.0'
          }

          obj.latestVersion = latestVersion

          return obj
        }
        catch (e) {
          obj.notdeployed = true

          return obj
        }
      })

      const results = await Promise.allSettled(promises)

      const arr = results
        .map((result) => {
          if (result.status === 'fulfilled')
            return result.value
        })
        .filter(Boolean)

      return arr as NetworkVersion[]
    },
    {
      immediate: true,
      watch: [safeAddress],
    },
  )

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

    const resp = await getBalances(account.value)

    eoaBalances.value = resp.flat()
  }

  async function fetchGasBalance() {
    if (!safeAddress.value)
      return

    try {
      pending.value.gasBalance = true
      const b = await avoProvider.getBalance(safeAddress.value).then(toBN)

      gasBalance.value = b.div(10 ** 18).toFixed()
    }
    finally {
      pending.value.gasBalance = false
    }
  }

  useIntervalFn(fetchGasBalance, 15000)

  const { pause, resume } = useIntervalFn(fetchBalances, 15000)

  watchThrottled(account,
    async () => {
      safeAddress.value = undefined
      eoaBalances.value = undefined

      await fetchSafeAddress()

      await until(tokens).toMatch(t => t.length > 0)
      Promise.all([
        fetchGasBalance(),
        fetchEoaBalances(),
      ])
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

  return {
    gasBalance,
    safeAddress,
    tokenBalances,
    totalBalance,
    fetchGasBalance,
    pending,
    balances,
    eoaBalances,
    totalEoaBalance,
    fetchBalances,
    forwarderProxyAddress,
    networkVersions,
    networkPreference,
    avoProvider,
    getBalances,
    fundedEoaNetworks,
  }
})

function logBalance(params: ILogBalanceParams) {
  const { isOnboard, isPublic, chainId } = params

  const style1 = 'color: #fff; background: #3c3c3c; padding: 4px 8px; border-radius: 4px; font-weight: bold;margin-right: 4px'
  const style2 = 'color: #fff; background: #007bff; padding: 4px 8px; border-radius: 4px; font-weight: bold;margin-right: 4px'
  const style3 = 'color: #fff; background: #16A34A; padding: 4px 8px; border-radius: 4px; font-weight: bold;'

  console.log(
    `%c${isPublic ? 'Public' : 'Private'}%c${isOnboard ? 'Onboarding' : 'Main'}%c${chainIdToName(chainId)}`,
    style1,
    style2,
    style3,
  )
}
if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot))
