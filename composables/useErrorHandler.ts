import { serialize } from 'error-serializer'

export const errorMessages = {
  metamaskUserDeniedSignature: 'user rejected signing',
  estimateGasError: 'cannot estimate gas',
  quoteExpired: 'quote has expired',
  quoteExpired2: '0_K',
}

export class InvalidENSError extends Error {}

export function useErrorHandler() {
  const parseTransactionError = (error: Error) => {
    const parsedError = serialize(error)
    const userRejected = isRequestUserRejected(error)

    const errorMessage = parsedError.message || ''

    console.error(errorMessage)

    let formatted
      = parsedError?.error?.message
      || parsedError.message
      || 'Something went wrong'

    if (error instanceof InvalidENSError)
      formatted = 'Invalid ENS name'

    if (userRejected)
      formatted = 'Signing rejected'

    if (errorMessage.includes(errorMessages.estimateGasError)) {
      formatted
        = 'Cannot estimate gas. Transaction may fail or may require manual gas limit'
    }

    if (errorMessage.includes(errorMessages.quoteExpired))
      formatted = 'Quote has expired, please try again'

    return {
      formatted,
      parsed: parsedError?.message,
      userRejected,
    }
  }

  function parseRequestError(error: any) {
    if (error.statusCode == '404') {
      error.statusMessage = 'Oops! Something went wrong!'
      error.message
        = 'The page you are looking for is either removed or had its URL changed, or is temporarily unavailable.'
    }

    return error
  }

  return {
    parseTransactionError,
    parseRequestError,
  }
}
