import axios from 'axios'

export function useMigrationDefi() {
  const { account } = useWeb3()
  const { defaultDefiApis } = useDefi()

  const positions = ref<MigrationPositions[]>([])

  function getActualNetworkSlug(name: string) {
    return name === 'Ethereum' ? 'mainnet' : name.toLocaleLowerCase()
  }

  function getPositionApis(dsaAccounts: IDsaAccount[]) {
    return defaultDefiApis.map(async (api) => {
      const { apiPath } = api
  
      const accountsByChainId = dsaAccounts.filter(
        i => i.chainId == api.chainId,
      )
  
      const userAccount = {
        address: account.value,
        id: undefined,
        version: undefined,
      }
  
      const accounts
        = api.protocol === 'makerdao'
          ? accountsByChainId
          : [userAccount, ...accountsByChainId]
  
      return Promise.allSettled(
        accounts.map(async (acc) => {
          const response = await axios.get(
            `https://api.instadapp.io/defi${apiPath}`,
            {
              params: {
                user: acc.address,
              },
              timeout: 20000,
            },
          )
  
          return {
            ...api,
            positions: response.data,
            dsaId: acc?.id || undefined,
            dsaAddress: acc?.id ? acc?.address : undefined,
            id: apiPath + acc.address,
          } as MigrationPositions
        }),
      ).then((resp) => {
        const data = [] as MigrationPositions[]
  
        for (const item of resp) {
          if (item.status === 'fulfilled') {
            const position = item.value as MigrationPositions
  
            data.push(position)
  
            let currentPosition = positions.value.find(
              i => i.id === position.id,
            )
  
            if (currentPosition)
              currentPosition = position
            else
              positions.value.push(position)
          }
        }
  
        return data
      })
    })
  }
  
  async function fetchDsaAccounts() {
    const networks = [
      ...new Set(
        defaultDefiApis.map(i => getNetworkByChainId(i.chainId).name),
      ),
    ]
  
    const data = await Promise.all(
      networks.map(async (name) => {
        const data = (await http(
          `https://api.instadapp.io/defi/${getActualNetworkSlug(
            name,
          )}/dsa/accounts`,
          {
            params: {
              user: account.value,
            },
          },
        )) as IDsaAccount[]
  
        const network = availableNetworks.find(
          i => i.name.toLowerCase() === name.toLowerCase(),
        )
  
        return data.map((i: any) => {
          return {
            ...i,
            chainId: network?.chainId,
          }
        })
      }),
    )
  
    return data.flat().filter(i => i.version == '2')
  }
  
  const fetchPositions = async () => {
    if (!account.value)
      return
  
    const dsaAccounts = await fetchDsaAccounts()
  
    const positionApis = getPositionApis(dsaAccounts)
  
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
