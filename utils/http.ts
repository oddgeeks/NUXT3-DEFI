import { ofetch } from 'ofetch'
import { serialize } from 'error-serializer'

interface ILogError {
  error: any
  notifyUser?: boolean
  notifyMessage?: string
}

export const logError = useThrottleFn((params: ILogError) => {
  const { error, notifyUser, notifyMessage } = params || {}
  const parsedError = serialize(error)

  const errorMessage = parsedError.message || ''

  logActionToSlack({
    account: '0x',
    action: 'network',
    message: `Error
    Request: ${error?.request}
    Error: ${errorMessage}
    Status: ${error?.response?._data?.statusCode}`,
    type: 'error',
  })

  if (notifyUser && notifyMessage) {
    notify({
      message: notifyMessage,
      type: 'error',
    })
  }
}, 1000)

export default ofetch.create({
  retry: 3,
  onResponseError: error => logError({ error, notifyUser: false }),
})
