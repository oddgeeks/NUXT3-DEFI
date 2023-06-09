import { acceptHMRUpdate, defineStore } from 'pinia'
import TrashSVG from '~/assets/images/icons/trash.svg?url'
import { AvoSafeImplementation__factory } from '~~/contracts'

export const useAuthorities = defineStore('authorities', () => {
  const { signer, safeAddress, mainSafeAddress } = useAvocadoSafe()
  const { avoProvider, forwarderProxyContract } = useSafe()
  const { account } = useWeb3()

  const safe = ref<ISafe>()
  const authoritiesSafeAddresses = ref<string[]>([])

  const selectedSafe = ref<ISafe>()
  const authoritiesSelectedSafeAddresses = ref<string[]>([])

  const mainSafeAuthorities = computed(() => {
    if (!safe.value)
      return []

    return formatAuthorities(safe.value.authorities, authoritiesSafeAddresses.value)
  })

  const selectedSafeAuthorities = computed(() => {
    if (!selectedSafe.value)
      return []

    return formatAuthorities(selectedSafe.value.authorities, authoritiesSelectedSafeAddresses.value)
  })

  const selectedSafeOwner = computed(() => {
    const authority = mainSafeAuthorities.value.find(i => i.safeAddress === safeAddress?.value)

    return authority?.address
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

  const fetchAuthorities = async (safeAddress: string) => {
    const resp = await avoProvider.send('api_getSafe', [safeAddress])
    const formattedAuthorities = formatAuthorities(resp.authorities)

    const safes = await Promise.all(formattedAuthorities.map(i => forwarderProxyContract.computeAddress(
      i.address,
    )))

    return {
      safeInstance: resp,
      safes,
    }
  }

  const fetchAuthoritySafes = async (authorityAddress: string) => {
    return avoProvider.send('api_getSafes', [{
      authority_address: authorityAddress,
    }])
  }

  const formatAuthorities = (input: ISafe['authorities'], safeAddresses: string[] = []): IAuthority[] => {
    const result = Object.entries(input).reduce((acc: IAuthority[], [key, value]: [string, string[]]) => {
      value.forEach((address: string, index) => {
        let existing = acc.find((item: IAuthority) => item.address === address)
        if (!existing) {
          const safeAddress = safeAddresses[index]

          existing = { address, chainIds: [], type: 'personal', safeAddress: safeAddress || '' }
          acc.push(existing)
        }
        existing.chainIds.push(key)
      })
      return acc
    }, [])

    return result
  }

  watch([safeAddress, mainSafeAddress], async () => {
    if (!safeAddress.value || !mainSafeAddress.value)
      return

    const { safeInstance, safes } = await fetchAuthorities(mainSafeAddress.value)

    authoritiesSafeAddresses.value = safes
    safe.value = safeInstance

    const { safeInstance: selectedSafeInstance, safes: selectedSafes } = await fetchAuthorities(safeAddress.value)

    authoritiesSelectedSafeAddresses.value = selectedSafes
    selectedSafe.value = selectedSafeInstance

    if (!account.value)
      return

    console.log(await fetchAuthoritySafes(mainSafeAddress.value))
  }, {
    immediate: true,
  })

  return {
    deleteAuthority,
    mainSafeAuthorities,
    selectedSafeAuthorities,
    selectedSafeOwner,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
