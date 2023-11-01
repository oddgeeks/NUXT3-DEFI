import axios from 'axios'

const colors: Record<'danger' | 'error' | 'success' | 'banner', string> = {
  danger: '#000000', // black
  error: '#D50201', // red
  success: '#2EA44E', // green
  banner: '#EFC35C', // yellow
}

const IGNORED_MESSAGES = ['/api/balances']

export default defineEventHandler(async (event) => {
  const { slackKey, slackErrorKey, slackStagingKey, slackBridgeErrorKey } = useRuntimeConfig()
  const { isProd } = useAppConfig()

  let { type = 'success', message, isBridgeError = false } = await readBody(event)

  if (message && IGNORED_MESSAGES.some(i => message.includes(i)))
    return {}

  if (!slackKey || !slackErrorKey || !slackStagingKey) {
    console.log({
      type,
      message,
    })
    return {}
  }

  let channelId = slackKey

  if (!isProd)
    channelId = slackStagingKey
  else if (isBridgeError)
    channelId = slackBridgeErrorKey

  else if (type === 'error' || type === 'banner')
    channelId = slackErrorKey

  if (process.env.NODE_ENV === 'development')
    message += `\n${'`Development`'}`

  if (type === 'observer')
    channelId = 'TCTP75BAM/B063K821B1C/uD6vGlNrXKWi21sLjuiImGtZ'

  await axios
    .post(
      `https://hooks.slack.com/services/${channelId}`,
      JSON.stringify({
        attachments: [
          {
            text: `[AvoApp] ${message}`,
            color: colors[type as keyof typeof colors],
          },
        ],
      }),
    )
    .catch(() => {})

  return {}
})
