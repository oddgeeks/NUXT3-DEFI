import axios from 'axios'

export function useMigrationDefi() {
  const { account } = useWeb3()
  const { defaultDefiApis } = useDefi()

  const positions = ref<MigrationPositions[]>([])

  function getPositionApis() {
    return defaultDefiApis.map(async (api) => {
      const { apiPath } = api
  
      const response = await axios.get(
        `https://api.instadapp.io/defi${apiPath}`,
        {
          params: {
            user: account.value,
          },
          timeout: 20000,
        },
      )

      const position = {
        ...api,
        positions: response.data,
        id: apiPath + account.value,
      } as MigrationPositions

      let currentPosition = positions.value.find(
        i => i.id === position.id,
      )

      if (currentPosition)
        currentPosition = position
      else
        positions.value.push(position)

      return [position]
    })
  }
  
  const fetchPositions = async () => {
    if (!account.value)
      return
  
    const positionApis = getPositionApis()

    const resp = await Promise.allSettled(positionApis)
  
    positions.value = resp
      .filter((r) => {
        if (r.status === 'fulfilled') { return true }
        else {
          console.error(r.reason)
          return false
        }
      })
      .flatMap(r => r.value)
  }

  return {
    fetchPositions,
    positions,
  }
}
