import axios from 'axios'

export function useNavigation() {
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { safeAddress, account } = useAvocadoSafe()

  const { data } = useAsyncData<IMultisigTransactionResponse>(async () => {
    if (!safeAddress.value || !account.value)
      return

    const { data } = await axios.get(`/safes/${safeAddress.value}/transactions`, {
      params: {
        status: 'pending',
      },
      baseURL: multisigURL,
    })

    console.log(data)

    return data
  }, {
    watch: [safeAddress, account],
  })

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
        label: 'Authorities',
        icon: 'SvgoAuthorities',
        to: '/authorities',
        tooltip: 'Authorities',
        hidden: isSafeMultisig.value,
      },
      {
        label: 'Signers',
        icon: 'SvgoUserCircle',
        to: '/signers',
        tooltip: 'Signers',
        hidden: !isSafeMultisig.value,
      },
    ]
  })

  tryOnMounted(() => {
    console.log('selam')
  })
  return {
    navigations,
  }
}
