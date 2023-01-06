export const errorMessages = {
  metamaskUserDeniedSignature: "user rejected signing",
  estimateGasError: "cannot estimate gas",
};

export function useErrorHandler() {
  const parseTransactionError = (error: any) => {
    const errorMessage =
      error.error?.message || error?.reason || "Something went wrong";

    if (errorMessage.includes(errorMessages.metamaskUserDeniedSignature)) {
      return "Signing rejected";
    }
    if (errorMessage.includes(errorMessages.estimateGasError)) {
      return "Cannot estimate gas. Transaction may fail or may require manual gas limit";
    }

    return errorMessage;
  };

  return {
    parseTransactionError,
  };
}
