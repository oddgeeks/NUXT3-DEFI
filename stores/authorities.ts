import { acceptHMRUpdate, defineStore } from 'pinia'
import TrashSVG from '~/assets/images/icons/trash.svg?url'
import { AvoSafeImplementation__factory } from '~~/contracts'

export const useAuthorities = defineStore('authorities', () => {
  const { safeAddress, signer } = useAvocadoSafe()
  const { avoProvider } = useSafe()

  const safe = ref<ISafe>()

  const authorities = computed(() => {
    if (!safe.value)
      return []

    return formatAuthorities(safe.value.authorities)
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

  const fetchAuthorities = async () => {
    const resp = await avoProvider.send('api_getSafe', [safeAddress.value])

    safe.value = resp
  }

  const formatAuthorities = (input: ISafe['authorities']): IAuthority[] => {
    const result = Object.entries(input).reduce((acc: IAuthority[], [key, value]: [string, string[]]) => {
      value.forEach((address: string) => {
        let existing = acc.find((item: IAuthority) => item.address === address)
        if (!existing) {
          existing = { address, chainIds: [] }
          acc.push(existing)
        }
        existing.chainIds.push(key)
      })
      return acc
    }, [])

    return result
  }

  watch(safeAddress, () => {
    if (!safeAddress.value)
      return
    fetchAuthorities()
  }, {
    immediate: true,
  })

  return {
    deleteAuthority,
    authorities,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useAuthorities, import.meta.hot))
