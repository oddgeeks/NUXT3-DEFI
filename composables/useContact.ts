import axios from 'axios'
import { getAddress } from 'ethers/lib/utils'

const contacts = useLocalStorage<IContact[]>('safe-contacts', [])
const oldContacts = useLocalStorage<Record<string, IContact[]>>('contacts', {})

export function useContacts() {
  const { safeAddress } = useAvocadoSafe()
  const { account } = useWeb3()
  const transferCounts = ref<ITransferCount[]>([])
  const abortController = ref<AbortController | null>(null)

  const ownerContact = computed(() => {
    if (!account.value)
      return null

    return {
      name: 'Your EOA address',
      address: account.value,
      chainId: '',
      owner: true,
    } as IContact
  })

  const safeContacts = computed(() => {
    if (!ownerContact.value)
      return contacts.value

    return [ownerContact.value, ...contacts.value || []] as IContact[]
  })

  const deleteContact = (contact: IContact) => {
    if (contact.owner)
      return

    if (!contacts.value)
      return

    const index = contacts.value.findIndex(
      (item: any) =>
        item.address.toLowerCase() === contact.address.toLowerCase()
        && item.chainId === contact.chainId,
    )
    if (index > -1)
      contacts.value.splice(index, 1)
  }

  const addContact = (contact: IContact) => {
    contact.address = getAddress(contact.address)

    const index = contacts.value.findIndex(
      (item: any) =>
        getAddress(item.address) === contact.address
        && item.chainId == contact.chainId,
    )

    if (index === -1)
      contacts.value.push(contact)
  }

  const editContact = (oldContact: IContact, newContact: IContact) => {
    const index = contacts.value.findIndex(
      (_contact: IContact) =>
        _contact.address.toLowerCase() === oldContact.address.toLowerCase()
        && _contact.chainId === oldContact.chainId,
    )
    if (index > -1) {
      newContact.address = getAddress(newContact.address)
      contacts.value[index] = newContact
    }
  }

  async function fetchTransferCounts() {
    if (!safeAddress.value || !safeContacts.value.length)
      return

    try {
      if (abortController.value)
        abortController.value.abort()

      abortController.value = new AbortController()

      const { data } = await axios.get('/api/transfers', {
        signal: abortController.value.signal,
        params: {
          from: safeAddress.value,
          to: safeContacts.value.map(_contact => _contact.address),
          chainIds: safeContacts.value.map(_contact => Number(_contact.chainId)),
        },
      })

      abortController.value = null

      transferCounts.value = data
    }

    catch (e) {
      console.log(e, 'selam')
    }
  }

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

  function migrateOldContacts() {
    const isOldContactsExist = Object.keys(oldContacts.value || {}).length > 0

    if (isOldContactsExist) {
      const oldContactsArray = Object.keys(oldContacts.value).reduce(
        (acc: IContact[], safeAddress) => {
          const contacts = oldContacts.value[safeAddress]
          return [...acc, ...contacts]
        }
        , [],
      )

      for (const contact of oldContactsArray)
        addContact(contact)

      // clear old contacts
      oldContacts.value = {}
    }
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
    migrateOldContacts,
  }
}
