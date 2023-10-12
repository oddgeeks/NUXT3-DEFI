import axios from 'axios'

export function useNavigation() {
  const { isSafeMultisig } = storeToRefs(useMultisig())
  const { safeAddress, account } = useAvocadoSafe()
  const { isAvocadoProtectActive, isSafeBackupSigner } = useMfa()

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
        label: 'Pending Transactions',
        icon: 'SvgoStopwatch',
        to: `/multisig/${safeAddress.value}/pending-transactions`,
        tooltip: 'Pending Transactions',
        hidden: !isSafeMultisig.value && !isSafeBackupSigner.value,
        count: totalPendingTransactions,
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
      {
        label: 'Transaction Builder',
        icon: 'SvgoHammer',
        to: '/transaction-builder',
        tooltip: 'Transaction Builder',
      },
      {
        label: 'Avocado Protect',
        icon: 'SvgoShield',
        to: '/protect',
        tooltip: 'Multi-Factor Authentication',
        hidden: !isAvocadoProtectActive.value,
      },
    ]
  })

  return {
    navigations,
  }
}
