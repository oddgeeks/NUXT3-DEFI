import { ethers } from 'ethers'
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia'
import { wait } from '@instadapp/utils'
import collect from 'collect.js'
import { getAddress } from 'ethers/lib/utils'
import type { IToken } from './tokens'
import type { TokenBalanceResolver } from '~/contracts'
import {
  AvoFactoryProxy__factory,
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

export const useSafe = defineStore('safe', () => {
  // balance aborter
  const balanceAborter = ref<AbortController>()
  const safeAddress = ref()
  const mainSafeAddress = ref()
  const multiSigSafeAddress = ref()
  const accountSafeMapping = ref<Record<string, string>>({})

  const safes = ref<ISafe[]>([])

  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()
  const multiSigSafe = ref<ISafe>()

  const { account, connector } = useWeb3()
  const { tokens, customTokens } = storeToRefs(useTokens())
  const { fetchTokenByAddress } = useTokens()
  const documentVisibility = useDocumentVisibility()
  const { parseTransactionError } = useErrorHandler()
  const { trackingAccount } = useAccountTrack()

  const forwarderProxyContract = Forwarder__factory.connect(
    forwarderProxyAddress,
    new ethers.providers.JsonRpcProvider(getRpcURLByChainId(137)),
  )

  const avoProvider = getRpcProvider(avoChainId)

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

  const fetchSafe = async (address: string) => {
    return avoProvider.send('api_getSafe', [address])
  }

  async function setMainSafe() {
    const resp = await fetchSafe(mainSafeAddress.value)

    if (!resp)
      mainSafe.value = getDefaultSafe(mainSafeAddress.value, 0)

    else
      mainSafe.value = resp
  }

  async function setSelectedSafe() {
    const resp = await fetchSafe(safeAddress.value)

    if (!resp) {
      const isMultiSafe = getAddress(safeAddress.value) === getAddress(multiSigSafeAddress.value)
      selectedSafe.value = getDefaultSafe(safeAddress.value, isMultiSafe ? 1 : 0)
    }
    else {
      selectedSafe.value = resp
    }

    accountSafeMapping.value[account.value] = safeAddress.value
  }

  async function setMultiSigSafe() {
    try {
      const resp = await fetchSafe(multiSigSafeAddress.value)

      if (!resp)
        multiSigSafe.value = getDefaultSafe(multiSigSafeAddress.value, 1)
      else
        multiSigSafe.value = resp
    }
    catch (e) {
    }
  }

  const fetchSafeAddress = async () => {
    if (!account.value)
      return

    const cachedSafeAddress = accountSafeMapping.value[account.value]

    if ((mainSafeAddress.value || safeAddress.value) && !cachedSafeAddress)
      return

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

    mainSafeAddress.value = address
    safeAddress.value = cachedSafeAddress || address
  }

  const fetchMultiSigSafeAddress = async () => {
    if (!account.value)
      return

    const multiSigAddress = await forwarderProxyContract.computeAddressMultisig(
      account.value,
    )

    multiSigSafeAddress.value = multiSigAddress
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
          const provider = getRpcProvider(network.chainId)

          const wallet = GaslessWallet__factory.connect(
            safeAddress.value,
            provider,
          )

          const latestVersion = await forwarderProxyContract.avoWalletVersion(
            '0x0000000000000000000000000000000000000001',
          )

          try {
            const currentVersion = await wallet.DOMAIN_SEPARATOR_VERSION()
            obj.currentVersion = currentVersion

            const forwarderProxyContract = Forwarder__factory.connect(
              forwarderProxyAddress,
              getRpcProvider(network.chainId),
            )

            const avoFactory = await forwarderProxyContract.avoFactory()

            const avoFactoryProxyContract = AvoFactoryProxy__factory.connect(
              avoFactory,
              provider,
            )

            const currentImplementationAddress = `0x${(await provider.getStorageAt(safeAddress.value, 0)).slice(-40)}`
            const latestImplementationAddress = selectedSafe.value?.multisig === 1 ? await avoFactoryProxyContract.avoMultisigImpl() : await avoFactoryProxyContract.avoWalletImpl()

            obj.currentImplementationAddress = currentImplementationAddress
            obj.latestImplementationAddress = latestImplementationAddress
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
              .filter(t => t.chainId == String(network.chainId))
              .map(t => t.address),
            ...customTokenAddress,
          ]).then((data) => {
            logBalance({ isPublic: true, chainId: network.chainId, isOnboard: !updateState })

            if (updateState)
              updateBalances(data)

            return data
          }).catch((error) => {
            console.log(error)
            return []
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

    if (safeAddress.value === incorrectAddress)

      return

    try {
      balances.value.loading = true
      // balanceAborter.value = new AbortController();

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

  const fetchSafes = async () => {
    const resp = await avoProvider.send('api_getSafes', [{
      address: account.value,
    }])

    safes.value = resp?.data || []
  }

  const resetAccounts = () => {
    trackingAccount.value = ''
    safeAddress.value = undefined
    mainSafeAddress.value = undefined
  }

  function getDefaultSafe(address: string, multisig: 0 | 1 = 0): ISafe {
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
    }
  }

  useIntervalFn(fetchGasBalance, 15000, {
    immediate: true,
  })

  useIntervalFn(fetchBalances, 15000)

  watch(
    account,
    async () => {
      if (!account.value)
        return

      try {
        pending.value.global = true

        await fetchSafeAddress()
        await fetchMultiSigSafeAddress()

        await setMainSafe()
        await setMultiSigSafe()
        fetchSafes()
      }
      finally {
        pending.value.global = false
      }
    },
    { immediate: true },
  )

  watch([safeAddress, account, tokens], () => {
    fetchBalances()
    fetchEoaBalances()
    fetchGasBalance()
  }, {
    immediate: true,
  })

  watch(safeAddress, () => {
    // reset balances
    balances.value.data = undefined
    eoaBalances.value = undefined
  })

  watch([safeAddress, multiSigSafeAddress], async () => {
    if (!safeAddress.value || !multiSigSafeAddress.value)
      return

    setSelectedSafe()
  }, {
    immediate: true,
  })

  watch(connector, () => {
    if (!connector.value)
      return
    connector.value.on('Web3ReactUpdate', (params) => {
      // only reset accounts if account changed
      if (params?.account)
        resetAccounts()
    })
  }, {
    immediate: true,
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
    forwarderProxyContract,
    resetAccounts,
    setSelectedSafe,
    accountSafeMapping,
    fetchSafe,
  }
}, {
  persist: {
    paths: ['safeAddress', 'mainSafeAddress', 'accountSafeMapping'],
  },
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useSafe, import.meta.hot))
