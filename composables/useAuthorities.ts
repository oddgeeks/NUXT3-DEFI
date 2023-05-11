const authorities = useLocalStorage<string[]>('authorities', [])

export function useAuthorities() {
  const addAuthority = (authority: string) => {
    authorities.value.push(authority)
  }

  const deleteAuthority = (authority: string) => {
    const index = authorities.value.findIndex(
      (item: any) =>
        item.toLowerCase() === authority.toLowerCase(),
    )
    if (index > -1)
      authorities.value.splice(index, 1)
  }

  return {
    addAuthority,
    deleteAuthority,
    authorities,
  }
}
