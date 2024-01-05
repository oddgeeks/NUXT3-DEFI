import { getAddress } from 'ethers/lib/utils'

const contacts = useLocalStorage<IContact[]>('safe-contacts', [])
const oldContacts = useLocalStorage<Record<string, IContact[]>>('contacts', {})
const transferCounts = ref<ITransferCount[]>([])

export function useContacts() {
  const { safeAddress } = useAvocadoSafe()
  const { account } = useWeb3()
  const abortController = ref<AbortController | null>(null)
  const { parseTransactionError } = useErrorHandler()
  const { checkSafeIsActualMultisig } = useMultisig()
  const { allSafes } = storeToRefs(useSafe())

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

    const result = [ownerContact.value]

    for (const safe of allSafes.value) {
      const multisig = checkSafeIsActualMultisig(safe)

      const existingContact = contacts.value.find(
        contact => isAddressEqual(contact.address, safe.safe_address),
      )

      if (existingContact)
        continue

      const defaultLabel = multisig ? 'MultiSig' : 'Personal'

      const walletName = useLocalStorage(`safe-label-${safe.safe_address}`, defaultLabel)

      result.push({
        address: safe.safe_address,
        chainId: '',
        name: walletName.value,
        notDeletable: true,
      })
    }

    return [...result, ...contacts.value]
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

  const addContact = (contact: IContact, shouldFetchTransferCounts = true) => {
    contact.address = getAddress(contact.address)

    const index = contacts.value.findIndex(
      (item: any) =>
        getAddress(item.address) === contact.address
        && item.chainId == contact.chainId,
    )

    if (index === -1)
      contacts.value.push(contact)

    if (shouldFetchTransferCounts)
      fetchTransferCounts()
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

    fetchTransferCounts()
  }

  async function fetchTransferCounts() {
    if (!safeAddress.value || !safeContacts.value.length)
      return

    try {
      if (abortController.value)
        abortController.value.abort()

      abortController.value = new AbortController()

      const data = await $fetch<ITransferCount[]>('/api/transfers', {
        signal: abortController.value.signal,
        params: {
          from: safeAddress.value,
          to: safeContacts.value.map(_contact => _contact.address),
          chainIds: safeContacts.value.map(_contact => Number(_contact.chainId)),
        },
      })

      abortController.value = null

      // update the contacts with transfer counts
      transferCounts.value = data
    }

    catch (e: any) {
      const err = parseTransactionError(e)
      if (err.parsed?.includes('aborted'))
        return

      logError({
        error: e,
        notifyUser: true,
        notifyMessage: 'Failed to fetch transfer counts',
      })
    }
  }

  const getSentTimes = (contact: IContact) => {
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

  function getContactNameByAddress(address: string, ownerName = 'You') {
    if (!address)
      return ''

    const contact = safeContacts.value.find(
      contact => getAddress(contact.address) === getAddress(address),
    )

    if (contact) {
      if (contact.owner)
        return ownerName

      return contact.name
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
    migrateOldContacts,
    getContactNameByAddress,
    fetchTransferCounts,
  }
}
