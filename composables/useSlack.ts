type MetadataTypes = typeof MetadataEnums[keyof typeof MetadataEnums]

interface ISlackMessage {
  message: string
  action: IWeb3Action | MetadataTypes | 'add-token' | 'upgrade' | 'deploy' | 'network' | 'nft' | 'multisig' | 'proposal' | 'fetch-nonce' | '2fa-activated' | '2fa-deactivated' | '2fa-method-activated' | '2fa-method-deactivated' | 'sign-terms'
  account: string
  type?: ISlackMessageType
  txHash?: string
  chainId?: string
  errorDetails?: string
  amountInUsd?: string
  network?: string
  isBridgeError?: boolean
}

const prefixes: Record<ISlackMessage['action'], string> = {
  'bridge': 'Bridged:',
  'swap': 'Swapped:',
  'gas-topup': '💥 Topup Gas:',
  'transfer': 'Transfer',
  'reedem': 'Reedemed:',
  'claim': 'Claimed:',
  'dapp': ':walletconnect:',
  'add-token': 'Added Token:',
  'upgrade': '',
  'deploy': 'Deployed:',
  'network': 'Network',
  'nft': 'NFT Transfer',
  'auth': 'Auth',
  'multisig': 'Executed Multisig Transaction',
  'proposal': 'MS Proposal Created',
  'fetch-nonce': 'Fetched Nonce',
  'add-signers': 'Added Signers',
  'remove-signers': 'Removed Signers',
  'change-threshold': 'Changed Threshold',
  'cross-transfer': 'Cross Transfer',
  'instadapp-pro': 'Instadapp Pro',
  'tx-builder': 'Tx Builder',
  'import': 'Import',
  'permit2': 'Permit',
  'rejection': 'Rejection',
  '2fa-activated': '2FA Activated',
  '2fa-deactivated': '2FA Deactivated',
  '2fa-method-activated': '2FA Activated',
  '2fa-method-deactivated': '2FA Deactivated',
  'sign-terms': 'Sign Terms',
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
  const { atLeastOneMfaVerifed, getMFAToken } = useMfa()
  const { avoExplorerURL, isProd } = storeToRefs(useEnvironmentState())
  const { isObservableAccount } = storeToRefs(useSafe())
  const latestMfaType = useState('latest-mfa-type')
  const { provider } = useWeb3()

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
    isBridgeError,
  } = slackMessage

  if (ignoredMessages.some(i => message && new RegExp(i).test(message)))
    return

  const prefix = getPrefix(amountInUsd, action)

  const mfaToken = getMFAToken()

  const explorerLink
    = chainId && txHash
      ? `<${`${avoExplorerURL.value}/tx/${txHash}`}|${shortenHash(
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

  if (atLeastOneMfaVerifed.value)
    logMessage += `\n${'`2FA`'}`

  if (latestMfaType.value)
    logMessage += `\n${'`2FA Method`'} ${latestMfaType.value}`

  if (mfaToken.value)
    logMessage += `\n${'`2FA Token`'} ${mfaToken.value}`

  if (errorDetails)
    logMessage += `\n${'`Error details`'} ${errorDetails}`

  if (isObservableAccount.value) {
    type = 'observer'
    logMessage = `<@UK9L88BS7>,<@U0146FL6CSZ> ${logMessage}`
  }

  const providerName = getWalletProviderName(provider.value)

  if (providerName)
    logMessage += `\n${'`Wallet Provider`'} ${providerName}`

  slack(logMessage, type, isBridgeError, isProd.value)

  latestMfaType.value = undefined
}

export function generateSlackMessage(_metadata: string, chainId: string | number, additionalMessage?: string) {
  const metadatalist = decodeMetadata(_metadata)

  if (!metadatalist || metadatalist.length == 0)
    return ''

  const [metadata] = metadatalist

  const type = metadata?.type as MetadataTypes

  if (!type)
    return ''

  const { getTokenByAddress } = useTokens()

  const metadataMapping: Record<MetadataTypes, () => string> = {
    'rejection': () => '',
    'auth': () => '',
    'change-threshold': () => `${metadata.count}`,
    'deploy': () => `Deployed ${chainIdToName(chainId)}`,
    'add-signers': () => `${metadata?.addresses?.length}`,
    'remove-signers': () => `${metadata?.addresses?.length}`,
    'tx-builder': () => `Executed ${metadata?.actionCount} transactions`,
    'instadapp-pro': () => metadata?.castDetails,
    'upgrade': () => `Upgraded to ${metadata.version}`,
    'dapp': () => `Txn on ${metadata.name} ${metadata.url}`,
    'import': () => `Imported from ${metadata.protocol} ${formatUsd(metadata.valueInUsd)}`,
    'gas-topup': () => {
      const token = getTokenByAddress(metadata.token, chainId)

      if (!token)
        return ''

      const amount = fromWei(metadata.amount, token.decimals).toFixed()

      return `${amount} ${formatSymbol(token.symbol)}`
    },
    'permit2': () => {
      const token = getTokenByAddress(metadata.token, chainId)
      if (!token)
        return ''

      const amount = fromWei(metadata.amount, token.decimals).toFixed()
      return `Permit ${formatDecimal(amount)} ${formatSymbol(
        token.symbol,
      )} to ${metadata.spender}`
    },
    'bridge': () => {
      const fromToken = getTokenByAddress(metadata.fromToken, chainId)
      const toToken = getTokenByAddress(metadata.toToken, metadata.toChainId)

      if (!fromToken || !toToken)
        return ''

      const amount = fromWei(metadata.amount, fromToken.decimals).toFixed()
      return `${formatDecimal(amount)} ${formatSymbol(
        fromToken.symbol,
      )} from ${formatSymbol(
        chainIdToName(fromToken.chainId),
        false,
      )} to ${formatSymbol(chainIdToName(toToken.chainId), false)}`
    },
    'swap': () => {
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
    },
    'transfer': () => {
      const token = getTokenByAddress(metadata.token, chainId)
      if (!token)
        return ''
      return `${formatDecimal(fromWei(metadata.amount, token.decimals).toFixed())} ${formatSymbol(
        token.symbol,
      )} to ${metadata.receiver}`
    },
    'cross-transfer': () => {
      const fromToken = getTokenByAddress(metadata.fromToken, chainId)
      const toToken = getTokenByAddress(metadata.toToken, metadata.toChainId)

      if (!fromToken || !toToken)
        return ''
      const amount = fromWei(metadata.amount, fromToken.decimals).toFixed()
      return `${formatDecimal(amount)} ${formatSymbol(
        fromToken.symbol,
      )} from ${formatSymbol(
        chainIdToName(chainId),
        false,
      )} to ${formatSymbol(chainIdToName(metadata.toChainId), false)}`
    },
  }

  const message = metadataMapping[type]()

  if (additionalMessage)
    return `${message}\n${additionalMessage}`

  return message
}

export function formatSymbol(str: string, isUpper = true) {
  const upper = isUpper ? str.toUpperCase() : str
  return `${upper} :${str?.replace('.', '')}:`
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

export function getWalletProviderName(provider: any) {
  const providerName = provider?.constructor?.name
  const { connectionMeta } = useConnectors()

  if (provider.isTrust)
    return 'trust'
  if (provider.isGoWallet)
    return 'goWallet'
  if (provider.isAlphaWallet)
    return 'alphaWallet'
  if (provider.isEQLWallet)
    return 'equal'
  if (provider.isStatus)
    return 'status'
  if (provider.isDapper)
    return 'dapper'
  if (provider.isSafe)
    return 'safe'
  if (provider.isRabby)
    return 'rabby'
  if (provider.isCucumber)
    return 'cucumber'
  if (provider.isImToken)
    return 'imtoken'
  if (provider.isGSNProvider)
    return 'GSN'
  if (provider.isToshi)
    return 'coinbase'
  if (provider.isLedgerConnect)
    return 'ledgerConnect'
  if (provider.isLedger)
    return 'ledger'
  if (provider.isTorus)
    return 'torus'
  // @ts-expect-error
  if (process.client && typeof window?.__CIPHER__ !== 'undefined')
    return 'cipher'
  if (providerName === 'EthereumProvider')
    return 'mist'
  if (providerName === 'Web3FrameProvider')
    return 'parity'
  if (provider.host && provider.host?.includes('infura') !== -1)
    return 'infura'
  if (provider.host && provider.host?.includes('localhost') !== -1)
    return 'localhost'
  if (provider.isMetaMask)
    return 'metamask'

  return connectionMeta?.value?.provider
}
