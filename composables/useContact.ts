export interface IContact {
  name: string;
  address: string;
  chainId: number | string;
}

const contacts = useLocalStorage<Record<string, IContact[]>>("contacts", {});

export function useContacts() {
  const { safeAddress } = useAvocadoSafe();

  const deleteContact = (contact: IContact) => {
    if (!contacts.value[safeAddress.value]) return;

    const index = contacts.value[safeAddress.value].findIndex(
      (item: any) =>
        item.address.toLowerCase() === contact.address.toLowerCase() &&
        item.chainId === contact.chainId
    );
    if (index > -1) {
      contacts.value[safeAddress.value].splice(index, 1);
    }
  };

  const addContact = (contact: IContact) => {
    if (contacts.value[safeAddress.value]) {
      contacts.value[safeAddress.value].push(contact);
    } else {
      contacts.value[safeAddress.value] = [contact];
    }
  };

  const editContact = (oldContact: IContact, newContact: IContact) => {
    if (!contacts.value[safeAddress.value]) {
      return;
    }

    const index = contacts.value[safeAddress.value].findIndex(
      (_contact: IContact) =>
        _contact.address.toLowerCase() === oldContact.address.toLowerCase() &&
        _contact.chainId === oldContact.chainId
    );
    if (index > -1) {
      contacts.value[safeAddress.value][index] = newContact;
    }
  };

  return { contacts, addContact, editContact, deleteContact };
}
