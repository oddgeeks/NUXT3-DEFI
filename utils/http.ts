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


import type { AxiosError } from 'axios'
export const handleAxiosError = (error: AxiosError, showUserError: boolean) => {
  const data = error?.response?.data as any
  const message = data?.message || data?.error
  const statusCode = error.response?.status
  // TODO: handle axios errors
  // Based on current env Log error to slack or sentry

  if (showUserError) {
    notify({
      message: message || 'Something went wrong',
      type: 'error',
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(error)
  }
}