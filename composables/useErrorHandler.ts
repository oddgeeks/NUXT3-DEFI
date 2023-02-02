export const errorMessages = {
  metamaskUserDeniedSignature: "user rejected signing",
  estimateGasError: "cannot estimate gas",
  quoteExpired: "quote has expired",
};

export function useErrorHandler() {
  const parseTransactionError = (error: any) => {
    console.log(error);
    const errorMessage =
      error.error?.message || error?.reason || "Something went wrong";

    if (errorMessage.includes(errorMessages.metamaskUserDeniedSignature)) {
      return "Signing rejected";
    }
    if (errorMessage.includes(errorMessages.estimateGasError)) {
      return "Cannot estimate gas. Transaction may fail or may require manual gas limit";
    }

    if (errorMessage.includes(errorMessages.quoteExpired)) {
      return "Quote has expired. Please refresh the page and try again";
    }

    return errorMessage;
  };

  function parseRequestError(error: any) {
    if (error.statusCode == "404") {
      error.statusMessage = "Oops! Something went wrong!";
      error.message =
        "The page you are looking for is either removed or had its URL changed, or is temporarily unavailable.";
    }

    return error;
  }

  return {
    parseTransactionError,
    parseRequestError,
  };
}
