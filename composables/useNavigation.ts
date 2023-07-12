import axios from 'axios'

export function useNavigation() {
  const { account } = useWeb3()
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { safeAddress } = useAvocadoSafe()

  const { data } = useAsyncData<IMultisigTransactionResponse>(async () => {
    const { data } = await axios.get(`/safes/${safeAddress.value}/transactions`, {
      params: {
        status: 'pending',
      },
      baseURL: multisigURL,
    })

    console.log(data)

    return data
  }, {
    watch: [safeAddress],
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
        to: `${avoExplorerURL}/address/${account.value}`,
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
