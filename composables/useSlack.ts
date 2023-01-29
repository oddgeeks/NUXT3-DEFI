interface ISlackMessage {
  message: string;
  action: IWeb3Action;
  account: string;
  type?: ISlackMessageType;
  txHash?: string;
  chainId?: string;
}

const prefixes: Record<ISlackMessage["action"], string> = {
  bridge: `🌉 Bridged:`,
  send: `💸 Sent:`,
  swap: `🔄 Swapped:`,
  topup: `⛽ Topup Gas:`,
  reedem: `🔑 🎁 Reedemed:`,
  claim: `🎁 Claimed:`,
};

export const logActionToSlack = (slackMessage: ISlackMessage) => {
  const {
    type = "success",
    action,
    chainId,
    txHash,
    message,
    account,
  } = slackMessage;
  const prefix = prefixes[action];
  
  const explorerLink = chainId && txHash ? `<${getExplorerUrl(chainId, `/tx/${txHash}`)}|${shortenHash(txHash, 12)}>`: "";
  
  const accountLink = chainId
    ?  `<${getExplorerUrl(chainId, `/address/${account}`)}|${shortenHash(account, 12)}>`
    : account;

  let logMessage = `${prefix} ${message}\n${"`User`"} ${accountLink}`;

  if (explorerLink) {
    logMessage += `\n${"`Tx`"} ${explorerLink}`;
  }

  slack(logMessage, type);
};

export const formatSymbol = (symbol: string) => {
  const upper = symbol.toUpperCase();
  return `${upper} :${symbol}:`;
};
