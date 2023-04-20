interface ISlackParams {
  title: string
  message: string
  address: string
  chainId: string | number | undefined
}

// Added slack logs to understand how is exactly balance fetching happening on production
export async function slackIt(type: ISlackMessageType,
  params: ISlackParams) {
  const { address, message, chainId, title } = params

  const msg = `${title}
${'`user`'} ${address}
${'`network`'} ${chainId}
${'`error`'}  ${message}`

  $fetch('/api/slack', {
    method: 'POST',
    body: {
      type,
      message: msg,
    },
  })
}
