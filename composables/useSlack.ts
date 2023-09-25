interface ISlackMessage {
  message: string
  action: IWeb3Action | 'wc' | 'add-token' | 'upgrade' | 'deploy' | 'network' | 'nft' | 'add-auth' | 'remove-auth' | 'multisig' | 'proposal' | 'fetch-nonce'
  account: string
  type?: ISlackMessageType
  txHash?: string
  chainId?: string
  errorDetails?: string
  amountInUsd?: string
  network?: string
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
  'add-auth': 'Added Authority',
  'remove-auth': 'Removed Authority',
  'multisig': 'Executed Multisig Transaction',
  'proposal': 'MS Proposal Created',
  'fetch-nonce': 'Fetched Nonce',
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
  const { isSafeMultisig } = storeToRefs(useMultisig())

  const build = useBuildInfo()

  let {
    type = 'success',
    action,
    chainId,
    txHash,
    message,
    account,
    errorDetails,
    amountInUsd = '0',
    network,
  } = slackMessage

  if (ignoredMessages.some(i => message && new RegExp(i).test(message)))
    return

  const prefix = getPrefix(amountInUsd, action)

  const explorerLink
    = chainId && txHash
      ? `<${`${avoExplorerURL}/tx/${txHash}`}|${shortenHash(
          txHash,
          12,
        )}>`
      : ''

  const accountLink = `<https://avocado.instadapp.io/?user=${account}|${shortenHash(
    account,
    12,
  )}>`

  const formattedNetwork = network || (chainId ? `:${formatChainName(chainId)}:` : '')

  if (formattedNetwork)
    message += `\n${'`Network`'} ${formattedNetwork}`

  let logMessage = `${prefix} ${message}\n${'`User`'} ${accountLink}`

  if (explorerLink)
    logMessage += `\n${'`Tx`'} ${explorerLink}`

  logMessage += `\n${'`Commit`'} ${build.commit}`
  logMessage += `\n${'`Env`'} ${build.env}`
  logMessage += `\n${'`Branch`'} ${build.branch}`

  if (isSafeMultisig.value)
    logMessage += `\n${'`Multisig`'}`

  if (errorDetails)
    logMessage += `\n${'`Error details`'} ${errorDetails}`

  slack(logMessage, type)
}

export function generateSlackMessage(metadatas: any, chainId: string | number) {
  const metadatalist = decodeMetadata(metadatas)
  if (!metadatalist)
    return ''
  if (metadatalist.length == 0)
    return ''
  const metadata = metadatalist.at(0)
  const { getTokenByAddress } = useTokens()
  switch (metadata.type) {
    case MetadataEnums.bridge: {
      const fromToken = getTokenByAddress(metadata.fromToken, chainId)
      const toToken = getTokenByAddress(metadata.toToken, metadata.toChainId)

      if (!fromToken || !toToken)
        break

      const amount = fromWei(metadata.amount, fromToken.decimals).toFixed()
      return `${formatDecimal(amount)} ${formatSymbol(
        fromToken.symbol,
      )} from ${formatSymbol(
        chainIdToName(fromToken.chainId),
        false,
      )} to ${formatSymbol(chainIdToName(toToken.chainId), false)}`
    }
    case MetadataEnums.deploy: {
      return `${chainIdToName(chainId)}`
    }
    case MetadataEnums.swap: {
      const sellToken = getTokenByAddress(metadata.sellToken, chainId)
      const buyToken = getTokenByAddress(metadata.buyToken, chainId)

      if (!sellToken || !buyToken)
        return ''

      const sellAmt = fromWei(metadata.sellAmount, sellToken?.decimals).toFixed()
      const buyAmt = fromWei(metadata.buyAmount, buyToken?.decimals).toFixed()
      return `${formatDecimal(sellAmt)} ${formatSymbol(
        sellToken.symbol,
      )} to ${formatDecimal(buyAmt)} ${formatSymbol(
        buyToken.symbol,
      )}`
    }
    case MetadataEnums['gas-topup']: {
      return `Gas Top up ${metadata.amount} ${formatSymbol('usdc')}`
    }
    case MetadataEnums.upgrade:
      return `Upgraded to ${metadata.version}`
    case MetadataEnums.transfer: {
      const token = getTokenByAddress(metadata.token, chainId)
      if (!token)
        return ''
      return `${formatDecimal(fromWei(metadata.amount, token.decimals).toFixed())} ${formatSymbol(
        token.symbol,
      )} to ${metadata.receiver}`
    }
    case MetadataEnums['cross-transfer']: {
      const fromToken = getTokenByAddress(metadata.fromToken, chainId)
      const toToken = getTokenByAddress(metadata.toToken, metadata.toChainId)

      if (!fromToken || !toToken)
        break

      const amount = fromWei(metadata.amount, fromToken.decimals).toFixed()
      return `${formatDecimal(amount)} ${formatSymbol(
        fromToken.symbol,
      )} from ${formatSymbol(
        chainIdToName(fromToken.chainId),
        false,
      )} to ${formatSymbol(chainIdToName(toToken.chainId), false)}`
    }
    default:
      break
  }
  return ''
}

export function formatSymbol(str: string, isUpper = true) {
  const upper = isUpper ? str.toUpperCase() : str
  return `${upper} :${str}:`
}

export function formatChainName(chainId: string | number) {
  const name = chainIdToName(chainId)
  return name.toLowerCase().replace(' ', '-')
}

function getPrefix(amountInUsd: string, action: ISlackMessage['action']) {
  const actionPrefix = prefixes[action]
  let emoji = ''

  if (gte(amountInUsd, '100000'))
    emoji = '🐳'

  else if (gte(amountInUsd, '10000'))
    emoji = '🚀'

  else if (gte(amountInUsd, '100'))
    emoji = '🔥'

  if (emoji)
    return `${emoji} (${formatUsd(amountInUsd)}) ${actionPrefix}`

  return actionPrefix
}
