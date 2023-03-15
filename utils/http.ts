import { ofetch } from "ofetch";

const logError = useThrottleFn((error) => {
  logActionToSlack({
    account: "0x",
    action: "network",
    message: `Error
Request: ${error.request}
Error: ${error.response._data.error}
Status: ${error.response._data.statusCode}`,
    type: "error",
  });
}, 1000);

export default ofetch.create({
  retry: 3,
  onResponseError: (error) => logError(error),
});
