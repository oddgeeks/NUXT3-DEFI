import axios from "axios";
import { _getAppConfig } from "nuxt/app";

const colors: Record<"danger" | "error" | "success" | "banner", string> = {
  danger: "#000000", // black
  error: "#D50201", // red
  success: "#2EA44E", // green
  banner: "#EFC35C", // yellow
};

export default defineEventHandler(async (event) => {
  const { slackKey, slackErrorKey, slackStagingKey } = useRuntimeConfig();

  const config = _getAppConfig();

  let { type = "success", message } = await readBody(event);

  if (!slackKey || !slackErrorKey || !slackStagingKey) {
    console.log({
      type,
      message,
    });
    return {};
  }

  const prod = config.buildInfo.env === "release";

  console.log(config.buildInfo.env, prod);

  let channelId = slackKey;

  if (!prod) {
    channelId = slackStagingKey;
  } else if (type === "error") {
    channelId = slackErrorKey;
  }

  if (process.env.NODE_ENV === "development") {
    message += `\n${"`Development`"}`;
  }

  await axios
    .post(
      `https://hooks.slack.com/services/${channelId}`,
      JSON.stringify({
        attachments: [
          {
            text: message,
            color: colors[type as keyof typeof colors],
          },
        ],
      })
    )
    .catch(() => {});

  return {};
});
