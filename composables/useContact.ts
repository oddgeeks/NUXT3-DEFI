import { isAddress } from '@ethersproject/address'
import { getAddress } from 'ethers/lib/utils'

const contacts = useLocalStorage<Record<string, IContact[]>>('contacts', {})

export function useContacts() {
  const { safeAddress } = useAvocadoSafe()
  const { account } = useWeb3()
  const transferCounts = ref<ITransferCount[]>([])

  const ownerContact = computed(() => {
    if (!account.value)
      return null

    return {
      name: 'Owner',
      address: account.value,
      chainId: '',
      owner: true,
    } as IContact
  })

  const safeContacts = computed(() => {
    if (!safeAddress.value || !ownerContact.value)
      return []

    const _contacts = contacts.value[safeAddress.value] || []

    return [ownerContact.value, ..._contacts] as IContact[]
  })

  const deleteContact = (contact: IContact) => {
    if (contact.owner)
      return

    if (!contacts.value[safeAddress.value])
      return

    const index = contacts.value[safeAddress.value].findIndex(
      (item: any) =>
        item.address.toLowerCase() === contact.address.toLowerCase()
        && item.chainId === contact.chainId,
    )
    if (index > -1)
      contacts.value[safeAddress.value].splice(index, 1)
  }

  const addContact = (contact: IContact) => {
    contact.address = getAddress(contact.address)

    if (contacts.value[safeAddress.value])
      contacts.value[safeAddress.value].push(contact)
    else
      contacts.value[safeAddress.value] = [contact]
  }

  const editContact = (oldContact: IContact, newContact: IContact) => {
    if (!contacts.value[safeAddress.value])
      return

    const index = contacts.value[safeAddress.value].findIndex(
      (_contact: IContact) =>
        _contact.address.toLowerCase() === oldContact.address.toLowerCase()
        && _contact.chainId === oldContact.chainId,
    )
    if (index > -1) {
      newContact.address = getAddress(newContact.address)
      contacts.value[safeAddress.value][index] = newContact
    }
  }

  watch(
    [safeAddress, contacts],
    async () => {
      if (!safeAddress.value)
        return

      if (!safeContacts.value || safeContacts.value.length === 0)
        return []

      let newContacts = safeContacts.value

      newContacts = safeContacts.value.filter(
        contact =>
          transferCounts.value.findIndex(
            transfer =>
              transfer.from === safeAddress.value
              && transfer.to === contact?.address.toLowerCase()
              && transfer.chainId == contact.chainId,
          ) === -1 && isAddress(contact?.address),
      )

      if (newContacts.length !== 0) {
        const res = await http('/api/transfers', {
          params: {
            from: safeAddress.value,
            to: newContacts.map(_contact => _contact.address),
            chainIds: newContacts.map(_contact => Number(_contact.chainId)),
          },
        })

        transferCounts.value = [...transferCounts.value, ...res]
      }
    },
    { immediate: true },
  )

  const getSentTimes = (contact: IContact) => {
    if (transferCounts.value) {
      const info = transferCounts.value.find(
        item =>
          item.to.toLowerCase() === contact.address.toLowerCase()
          && item.chainId == contact.chainId,
      )
      if (!info)
        return ''

      return `Sent ${info.transferCount} ${
        info.transferCount === 1 ? 'time' : 'times'
      }`
    }
    return ''
  }

  return {
    ownerContact,
    safeContacts,
    contacts,
    addContact,
    editContact,
    deleteContact,
    transferCounts,
    getSentTimes,
  }
}
