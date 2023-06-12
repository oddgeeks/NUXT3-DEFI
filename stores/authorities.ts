import { acceptHMRUpdate, defineStore } from 'pinia'
import TrashSVG from '~/assets/images/icons/trash.svg?url'
import { AvoSafeImplementation__factory } from '~~/contracts'

export const useAuthorities = defineStore('authorities', () => {
  const { signer, safeAddress, mainSafeAddress } = useAvocadoSafe()
  const { avoProvider } = useSafe()
  const { account } = useWeb3()

  const safes = ref<ISafe[]>([])
  const selectedSafe = ref<ISafe>()
  const mainSafe = ref<ISafe>()

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
    const resp = await avoProvider.send('api_getSafes', [{
      authority_address: account.value,
    }])

    console.log({
      EOA: account.value,
      safes: resp?.data,
    })

    safes.value = resp?.data || []
  }

  const fetchSafe = async (safeAddress: string) => {
    return avoProvider.send('api_getSafe', [safeAddress])
  }

  watch(account, async () => {
    if (!account.value)
      return

    fetchSafes()
  }, {
    immediate: true,
  })

  watch(safeAddress, async () => {
    if (!safeAddress.value)
      return

    const resp = await fetchSafe(safeAddress.value)
    selectedSafe.value = resp
  }, {
    immediate: true,
  })

  watch(mainSafeAddress, async () => {
    if (!mainSafeAddress.value)
      return

    const resp = await fetchSafe(mainSafeAddress.value)
    mainSafe.value = resp
  }, {
    immediate: true,
  })

  return {
    deleteAuthority,
    authorities,
    mainSafe,
    safes,
    selectedSafe,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
