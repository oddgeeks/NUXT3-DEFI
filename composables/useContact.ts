import { getAddress } from 'ethers/lib/utils'

const contacts = useLocalStorage<IContact[]>('safe-contacts', [])
const oldContacts = useLocalStorage<Record<string, IContact[]>>('contacts', {})
const transferCounts = ref<ITransferCount[]>([])

export function useContacts() {
  const { safeAddress } = useAvocadoSafe()
  const { account } = useWeb3()
  const abortController = ref<AbortController | null>(null)
  const { parseTransactionError } = useErrorHandler()
  const { mainSafe, multiSigSafe, safes, legacySafe, legacySafeAddress, safesLoading, selectedSafe } = storeToRefs(useSafe())
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
    var types = {
      "Personal": 1,
      "MultiSig": 1,
      "Legacy": 1
    };

    var result = [ownerContact.value]

    for (const safe of allSafes.value) {
      var name: "Personal" | "MultiSig" | "Legacy" = "Personal";
      var contact_name;
      if (checkSafeIsActualMultisig(safe)) {
        name = "MultiSig"
      }
      else if (safe.multisig === 0) {
        name = "Legacy"
      }
      let bFound = false
      for (const contact of result) {
        if (safe.safe_address === contact.address) {
          bFound = true
          break
        }
      }
      if (bFound)
        continue
      if (types[name] !== 1) {
        contact_name = name + types[name];
      }
      else {
        contact_name = name;
      }
      types[name] ++;
      result.push({
        name: contact_name,
        address: safe.safe_address,
        chainId: ''
      })
    }

    return result
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
