const contacts = useLocalStorage<any>("contacts", {});

export function useContacts() {
  return { contacts };
}
