import axios from 'axios'

export function useNavigation() {
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { safeAddress, account } = useAvocadoSafe()

  const { data, refresh } = useAsyncData<IMultisigTransactionResponse>(async () => {
    if (!safeAddress.value || !account.value)
      return

    const { data } = await axios.get(`/safes/${safeAddress.value}/transactions`, {
      params: {
        status: 'pending',
      },
      baseURL: multisigURL,
    })

    return data
  }, {
    watch: [safeAddress, account],
  })

  useIntervalFn(refresh, 15000)

  const navigations = computed(() => {
    const totalPendingTransactions = data.value?.meta?.total || 0
    const pendingTransactionsLabel = totalPendingTransactions ? `Pending Transactions (${totalPendingTransactions})` : 'Pending Transactions'

    return [
      {
        icon: 'SvgoHome',
        label: 'Home',
        to: '/',
        tooltip: 'Home',
      },
      {
        label: 'DeFi',
        icon: 'SvgoDefi',
        to: '/defi',
        tooltip: 'View your DeFi Positions',
      },
      {
        label: pendingTransactionsLabel,
        icon: 'SvgoStopwatch',
        to: `/multisig/${safeAddress.value}/pending-transactions`,
        tooltip: pendingTransactionsLabel,
        hidden: !isSafeMultisig.value,
      },
      {
        label: 'NFT',
        icon: 'SvgoFire',
        to: '/nft',
        tooltip: 'View your NFTs',
      },
      {
        label: 'Contacts',
        icon: 'SvgoContact',
        to: '/contacts',
        tooltip: 'Contacts',
      },
      {
        label: 'History',
        icon: 'SvgoCalendar',
        external: true,
        target: '_blank',
        to: `${avoExplorerURL}/address/${safeAddress.value}`,
        tooltip: 'History',
      },
      {
        label: 'Signers',
        icon: 'SvgoUserCircle',
        to: `/multisig/${safeAddress.value}/signers`,
        tooltip: 'Signers',
        hidden: !isSafeMultisig.value,
      },
    ]
  })

  return {
    navigations,
  }
}
