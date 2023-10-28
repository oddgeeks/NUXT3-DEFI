import type { IBalance } from '~~/stores/safe'

export function useGraph(balance: Ref<IBalance>) {
  const { authorisedNetworks } = useAuthorities()
  const { isSelectedSafeLegacy } = storeToRefs(useSafe())
  const { isSafeBackupSigner } = useMfa()

  const nonAuthorised = computed(() => !authorisedNetworks.value?.find(i => String(i.chainId) == String(balance.value.chainId)))

  const fuseDisabled = computed(() => isSelectedSafeLegacy.value && String(balance.value.chainId) === '122')

  const interactable = computed(() => {
    return toBN(balance.value.balance).gt(0) && !nonAuthorised.value && !fuseDisabled.value && !isSafeBackupSigner.value
  })

  const isSwapDisabled = computed(() => swapDisabledChains.some(i => String(i) == String(balance.value.chainId)))

  const isBridgeDisabled = computed(() => bridgeDisabledChains.some(i => String(i) == String(balance.value.chainId)))

  const priceDiffColor = computed(() => {
    if (!priceDiffInPercent.value)
      return 'rgb(148 163 184)'

    if (priceDiffInPercent.value < 0)
      return '#EB5757'

    return '#07A65D'
  })

  const priceDiffInPercent = computed(() => {
    if (!balance.value.sparklinePrice7d.length)
      return 0
    const a = balance.value.sparklinePrice7d.at(-24)!
    const b = balance.value.sparklinePrice7d.at(-1)!
    return (100 * (b - a)) / a
  })

  const priceDiffClass = computed(() => {
    if (!priceDiffInPercent.value)
      return 'text-slate-400'

    if (priceDiffInPercent.value < 0)
      return 'text-red-alert'

    return 'text-primary'
  })

  async function fetchLiteAPY(tokenBalance: IBalance) {
    const isEthAddress = tokenBalance.address.toLowerCase() === ethAddress.toLowerCase()
    const isMainnet = tokenBalance.chainId === '1'

    if (!isEthAddress || !isMainnet)
      return

    try {
      const vaults = await $fetch(`https://api.instadapp.io/v2/mainnet/lite/users/${incorrectAddress}/vaults`) as any[]
      const v2EthVault = vaults.find(v => v.version === '2' && v.tokenAddress === ethAddress)

      if (!v2EthVault)
        return

      return div(v2EthVault.apy.apyWithoutFee, 100).toString()
    }
    catch (e) {
      console.log(e)
    }
  }

  return {
    interactable,
    priceDiffColor,
    priceDiffInPercent,
    priceDiffClass,
    isSwapDisabled,
    fetchLiteAPY,
    isBridgeDisabled,
    nonAuthorised,
    fuseDisabled,
  }
}
