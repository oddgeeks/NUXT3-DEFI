import { BigNumber } from 'ethers'

const ETHERSCAN_BASE_URLS: Record<number, string> = {
  1: 'https://api.etherscan.io',
  137: 'https://api.polygonscan.com',
  42161: 'https://api.arbiscan.io',
  10: 'https://api-optimistic.etherscan.io',
  56: 'https://api.bscscan.com',
  100: 'https://api.gnosisscan.io',
  43114: 'https://api.snowtrace.io',
  1101: 'https://api-zkevm.polygonscan.com',
}

export async function getTokenTransfersByEtherscan(from: string,
  to: string[],
  chainId: number): Promise<Record<string, number>> {
  const baseUrl = ETHERSCAN_BASE_URLS[chainId]

  if (to.length === 0 || !baseUrl)
    return {}

  const transferCounts: Record<string, number> = {}
  for (let i = 0; i < to.length; i += 1)
    transferCounts[to[i].toLowerCase()] = 0

  let page = 0
  const limit = 10000

  do {
    const res: any = await $fetch(
      `${baseUrl}/api?module=account&action=tokentx&address=${from}&sort=asc&startblock=0&page=${page}`,
    )

    if (!res.result)
      break

    for (let i = 0; i < res.result.length; i += 1) {
      const item = res.result[i]
      if (
        !item?.from || !item?.to || (item.from.toLowerCase() !== from.toLowerCase())
        || BigNumber.from(item.value).isZero()
      )
        continue

      if (transferCounts[item.to.toLowerCase()] !== undefined)
        transferCounts[item.to.toLowerCase()] += 1
    }

    page += 1

    if (res.result.length < limit)
      break
  } while (true)

  return transferCounts
}

export async function getEtherTransfersByEtherscan(from: string,
  to: string[],
  chainId: number): Promise<Record<string, number>> {
  const baseUrl = ETHERSCAN_BASE_URLS[chainId]

  if (to.length === 0 || !baseUrl)
    return {}

  const transferCounts: Record<string, number> = {}
  for (let i = 0; i < to.length; i += 1)
    transferCounts[to[i].toLowerCase()] = 0

  let page = 0
  const limit = 10000

  do {
    const res: any = await $fetch(
      `${baseUrl}/api?module=account&action=txlistinternal&address=${from}&sort=asc&startblock=0&page=${page}`,
    )

    if (!res.result)
      break

    for (let i = 0; i < res.result.length; i += 1) {
      const item = res.result[i]
      if (
        !item.from
        || item.from.toLowerCase() !== from.toLowerCase()
        || BigNumber.from(item.value).isZero()
      )
        continue

      if (transferCounts[item.to.toLowerCase()] !== undefined)
        transferCounts[item.to.toLowerCase()] += 1
    }

    page += 1

    if (res.result.length < limit)
      break
  } while (true)

  return transferCounts
}
