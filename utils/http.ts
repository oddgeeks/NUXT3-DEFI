import { ofetch } from "ofetch";

const logError = useThrottleFn((error) => {
  const message =
    error?.response?._data?.error || error?.response?._data?.message;

  logActionToSlack({
    account: "0x",
    action: "network",
    message: `Error
  Request: ${error?.request}
  Error: ${message}
  Status: ${error?.response?._data?.statusCode}`,
    type: "error",
  });

  notify({
    message: message || "Something went wrong",
    type: "error",
  });
}, 1000);

export default ofetch.create({
  retry: 3,
  onResponseError: (error) => logError(error),
});
