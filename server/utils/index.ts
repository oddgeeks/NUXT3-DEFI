interface ISlackParams {
  title: string
  message: string
  address?: string
  chainId?: string | number | undefined
  userAddress?: string
}

// Added slack logs to understand how is exactly balance fetching happening on production
export async function slackIt(type: ISlackMessageType,
  params: ISlackParams) {
  const { address, userAddress, message, chainId, title } = params

  const accountLink = userAddress
    ? `<https://avocado.instadapp.io/?user=${userAddress}|${shortenHash(
    userAddress,
    12,
  )}>`
    : address || ''

  let msg = `${title}
${'`error`'}  ${message}`

  if (accountLink)
    msg += `${'`user`'} ${accountLink}`

  if (chainId)
    msg += `${'`network`'} ${chainId}`

  $fetch('/api/slack', {
    method: 'POST',
    body: {
      type,
      message: msg,
    },
  })
}
