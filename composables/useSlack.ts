interface ISlackMessage {
  message: string
  action: IWeb3Action | 'wc' | 'add-token' | 'upgrade' | 'deploy' | 'network' | 'nft'
  account: string
  type?: ISlackMessageType
  txHash?: string
  chainId?: string
  errorDetails?: string
}

const prefixes: Record<ISlackMessage['action'], string> = {
  'bridge': 'Bridged:',
  'send': 'Sent:',
  'swap': 'Swapped:',
  'topup': '💥 Topup Gas:',
  'reedem': 'Reedemed:',
  'claim': 'Claimed:',
  'wc': ':walletconnect:',
  'add-token': 'Added Token:',
  'upgrade': '',
  'deploy': 'Deployed:',
  'network': 'Network',
  'nft': 'NFT Transfer',
}

const ignoredMessages = [
  'Signing rejected',
  'Transaction rejected',
  'User declined transaction',
  'User rejected the transaction',
  'Cannot read properties of undefined',
  'Failed to get signature',
]

export function logActionToSlack(slackMessage: ISlackMessage) {
  const build = useBuildInfo()

  let {
    type = 'success',
    action,
    chainId,
    txHash,
    message,
    account,
    errorDetails,
  } = slackMessage

  if (ignoredMessages.some(i => message && new RegExp(i).test(message)))
    return

  const prefix = prefixes[action]

  const explorerLink
    = chainId && txHash
      ? `<${getExplorerUrl(chainId, `/tx/${txHash}`)}|${shortenHash(
          txHash,
          12,
        )}>`
      : ''

  const accountLink = `<https://avocado.instadapp.io/?user=${account}|${shortenHash(
    account,
    12,
  )}>`

  if (chainId)
    message += `\n${'`Network`'} :${formatChainName(chainId)}:`

  let logMessage = `${prefix} ${message}\n${'`User`'} ${accountLink}`

  if (explorerLink)
    logMessage += `\n${'`Tx`'} ${explorerLink}`

  logMessage += `\n${'`Commit`'} ${build.commit}`
  logMessage += `\n${'`Env`'} ${build.env}`
  logMessage += `\n${'`Branch`'} ${build.branch}`

  if (errorDetails)
    logMessage += `\n${'`Error details`'} ${errorDetails}`

  slack(logMessage, type)
}

export function formatSymbol(str: string, isUpper = true) {
  const upper = isUpper ? str.toUpperCase() : str
  return `${upper} :${str}:`
}

export function formatChainName(chainId: string) {
  const name = chainIdToName(chainId)
  return name.toLowerCase().replace(' ', '-')
}
