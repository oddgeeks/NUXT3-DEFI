const contacts = useLocalStorage<any>("contacts", {});

export function useContacts() {
  const { safeAddress } = useAvocadoSafe();

  const deleteContact = ({
    address,
    chainId,
  }: {
    address: string;
    chainId: string;
  }) => {
    if (!contacts.value[safeAddress.value]) return;

    const index = contacts.value[safeAddress.value].findIndex(
      (contact: any) =>
        contact.address.toLowerCase() === address.toLowerCase() &&
        contact.chainId === chainId
    );
    if (index > -1) {
      contacts.value[safeAddress.value].splice(index, 1);
    }
  };

  return { contacts, deleteContact };
}
