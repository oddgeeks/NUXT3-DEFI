interface ISlackMessage {
  message: string;
  action: IWeb3Action | "wc" | "add-token";
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
  wc: `:walletconnect:`,
  "add-token": `🆕 Added Token:`,
};

export const logActionToSlack = (slackMessage: ISlackMessage) => {
  const build = useBuildInfo();

  let {
    type = "success",
    action,
    chainId,
    txHash,
    message,
    account,
  } = slackMessage;
  const prefix = prefixes[action];

  const explorerLink =
    chainId && txHash
      ? `<${getExplorerUrl(chainId, `/tx/${txHash}`)}|${shortenHash(
          txHash,
          12
        )}>`
      : "";

  const accountLink = `<https://avocado.instadapp.io/?user=${account}|${shortenHash(
    account,
    12
  )}>`;

  if (chainId) {
    message += `\n${"`Network`"} :${chainIdToName(chainId)}:`;
  }

  let logMessage = `${prefix} ${message}\n${"`User`"} ${accountLink}`;

  if (explorerLink) {
    logMessage += `\n${"`Tx`"} ${explorerLink}`;
  }

  logMessage += `\n${"`Version`"} ${build.version}`;
  logMessage += `\n${"`Commit`"} ${build.commit}`;

  slack(logMessage, type);
};

export const formatSymbol = (str: string, isUpper = true) => {
  const upper = isUpper ? str.toUpperCase() : str;
  return `${upper} :${str}:`;
};
