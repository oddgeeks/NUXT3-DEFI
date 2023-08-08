import { ofetch } from 'ofetch'

const logError = useThrottleFn((error) => {
  const message
    = error?.response?._data?.error || error?.response?._data?.message

  logActionToSlack({
    account: '0x',
    action: 'network',
    message: `Error
  Request: ${error?.request}
  Error: ${message}
  Status: ${error?.response?._data?.statusCode}`,
    type: 'error',
  })

  notify({
    message: message || 'Something went wrong',
    type: 'error',
  })
}, 1000)

export default ofetch.create({
  retry: 3,
  onResponseError: error => logError(error),
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