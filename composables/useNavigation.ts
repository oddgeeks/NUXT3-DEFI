import { storeToRefs } from 'pinia'

export function useNavigation() {
  const { account } = useWeb3()
  const { isSafeMultisig } = storeToRefs(useAuthorities())

  const navigations = computed(() => {
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
        label: 'Pending Transactions',
        icon: 'SvgoAuthorities',
        to: '/multisig/pending-transactions',
        tooltip: 'Pending Transactions',
        hidden: !isSafeMultisig.value,
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
        icon: 'SvgoAuthorities',
        to: '/signers',
        tooltip: 'Authorities',
        hidden: !isSafeMultisig.value,
      },
    ]
  })

  return {
    navigations,
  }
}
