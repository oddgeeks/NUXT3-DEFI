import { acceptHMRUpdate, defineStore } from 'pinia'
import TrashSVG from '~/assets/images/icons/trash.svg?url'
import { AvoSafeImplementation__factory } from '~~/contracts'

export const useAuthorities = defineStore('authorities', () => {
  const { signer, safeAddress, mainSafeAddress } = useAvocadoSafe()
  const { avoProvider, forwarderProxyContract } = useSafe()
  const { account } = useWeb3()

  const safes = ref<ISafe[]>([])

  const selectedSafe = computed(() => {
    return safes.value.find((item: ISafe) => item.safe_address === safeAddress.value)
  })

  const authorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities)
  })

  const deleteAuthority = async (authority: IAuthority) => {
    const { success } = await openDialogModal({
      title: 'Are you sure you want to delete the Authority?',
      type: 'question',
      headerIconUrl: TrashSVG,
      isButtonVisible: true,
      isCancelButtonVisible: true,
      buttonText: 'Delete',
      cancelButtonText: 'Cancel',
      cancelButtonProps: {
        color: 'white',
      },
      buttonProps: {
        color: 'red',
      },
    })

    if (success) {
      const instance = AvoSafeImplementation__factory.connect(safeAddress.value, signer.value!)
      const resp = await instance.populateTransaction.addAuthorities([authority.address])

      const removeSignerAction = {
        target: safeAddress,
        data: resp.data,
        value: 0,
        operation: '0',
      }

      // TODO: delete authority
    }
  }

  const fetchSafes = async () => {
    const respSafes = await avoProvider.send('api_getSafes', [{
      authority_address: account.value,
    }])

    safes.value = respSafes?.data || []
  }

  const fetchSafe = async () => {
    return avoProvider.send('api_getSafe', [safeAddress.value])
  }

  const formatAuthorities = (input: ISafe['authorities']): IAuthority[] => {
    const result = Object.entries(input).reduce((acc: IAuthority[], [key, value]: [string, string[]]) => {
      value.forEach((address: string) => {
        let existing = acc.find((item: IAuthority) => item.address === address)
        if (!existing) {
          existing = { address, chainIds: [], type: 'personal' }
          acc.push(existing)
        }
        existing.chainIds.push(key)
      })
      return acc
    }, [])

    return result
  }

  watch([safeAddress, account], async () => {
    if (!safeAddress.value || !account.value)
      return

    fetchSafes()
  }, {
    immediate: true,
  })

  return {
    deleteAuthority,
    authorities,
    safes,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
