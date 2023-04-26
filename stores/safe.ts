import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { wait } from '@instadapp/utils'
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

const balanceResolverContracts = availableNetworks.reduce((acc, curr) => {
  acc[curr.chainId] = TokenBalanceResolver__factory.connect(
    '0x3fb128aa5ac254c8539996b11c587e521ae0d3ab',
    getRpcProvider(curr.chainId),
  )
  return acc
}, {} as Record<string, TokenBalanceResolver>)

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
        $fetch<IToken[]>(`https://prices.instadapp.io/${chainId}/tokens`, {
          params: {
            includeSparklinePrice7d: false,
            addresses,
          },
        }),
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
            address: tokenPrice.address,
            decimals: tokenPrice.decimals,
            symbol: tokenPrice.symbol,
            logoURI: tokenPrice.logoURI,
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

export const useSafe = defineStore('safe', () => {
  // balance aborter
  const balanceAborter = ref<AbortController>()
  const safeAddress = ref()

  const { account } = useWeb3()
  const { tokens, customTokens } = storeToRefs(useTokens())
  const documentVisibility = useDocumentVisibility()
  const { parseTransactionError } = useErrorHandler()

  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    new ethers.providers.JsonRpcProvider(getRpcURLByChainId(137)),
  )

  const avoProvider = getRpcProvider(avoChainId)

  const networkPreference = ref(
    new Set(availableNetworks.map(el => el.chainId)),
  )

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

  const fetchSafeddress = async () => {
    if (!account.value) {
      safeAddress.value = undefined
      return
    }

    safeAddress.value = await forwarderProxyContract.computeAddress(
      account.value,
    )
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
            getRpcProvider(network.chainId),
          )

          const forwarderProxyContract = Forwarder__factory.connect(
            forwarderProxyAddress,
            getRpcProvider(network.chainId),
          )

          const latestVersion = await forwarderProxyContract.avoWalletVersion(
            '0x0000000000000000000000000000000000000001',
          )

          const currentVersion = await wallet.DOMAIN_SEPARATOR_VERSION()

          obj.latestVersion = latestVersion
          obj.currentVersion = currentVersion

          return obj
        }
        catch (e) {
          // console.log(e);
          obj.notdeployed = true

          obj.latestVersion = '0.0.0'
          obj.currentVersion = '0.0.0'
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

  onMounted(async () => {
    await wait(1000)

    await fetchGasBalance()
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

        try {
          return getChainBalances(String(network.chainId), address, [
            ...tokens.value
              .filter(t => t.chainId === String(network.chainId))
              .map(t => t.address),
            ...customTokenAddress,
          ]).then((data) => {
            logBalance({ isPublic: true, chainId: network.chainId, isOnboard: !updateState })

            if (updateState)
              updateBalances(data)

            return data
          })
        }
        catch (error) {
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
        }
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
    // if (balanceAborter.value) balanceAborter.value.abort();

    try {
      balances.value.loading = true
      // balanceAborter.value = new AbortController();

      if (safeAddress.value === incorrectAddress) {
        balances.value.data = []
        notify({
          type: 'warning',
          message: 'Safe Address is not valid',
        })

        return
      }

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
    }
  }

  async function fetchGasBalance() {
    if (!account.value)
      return

    try {
      pending.value.gasBalance = true
      const b = await avoProvider.getBalance(account.value).then(toBN)

      gasBalance.value = b.div(10 ** 18).toFixed()
    }
    finally {
      pending.value.gasBalance = false
    }
  }

  useIntervalFn(fetchGasBalance, 15000, {
    immediate: true,
  })

  useIntervalFn(fetchBalances, 15000)

  watch(
    [account],
    async () => {
      try {
        pending.value.global = true
        safeAddress.value = undefined
        fetchGasBalance()
        await fetchSafeddress()
      }
      finally {
        pending.value.global = false
      }
    },
    { immediate: true },
  )

  watch([safeAddress, account, tokens], () => {
    fetchBalances()
  }, {
    immediate: true,
  })

  watch(safeAddress, () => {
    balances.value.data = undefined // reset balances
  })

  return {
    gasBalance,
    safeAddress,
    tokenBalances,
    totalBalance,
    fetchGasBalance,
    pending,
    balances,
    fetchBalances,
    forwarderProxyAddress,
    networkVersions,
    networkPreference,
    avoProvider,
    getBalances,
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
