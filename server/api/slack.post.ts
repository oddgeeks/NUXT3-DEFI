import axios from "axios";

const colors: Record<"danger" | "error" | "success" | "banner", string> = {
  danger: "#000000", // black
  error: "#D50201", // red
  success: "#2EA44E", // green
  banner: "#EFC35C", // yellow
};

export default defineEventHandler(async (event) => {
  const { slackKey, slackErrorKey, slackStagingKey } = useRuntimeConfig();
  const { isProd } = useAppConfig();

  let { type = "success", message } = await readBody(event);

  if (!slackKey || !slackErrorKey || !slackStagingKey) {
    console.log({
      type,
      message,
    });
    return {};
  }

  let channelId = slackKey;

  if (!isProd) {
    channelId = slackStagingKey;
  } else if (type === "error" || type === "banner") {
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
            text: `[AvoApp] ${message}`,
            color: colors[type as keyof typeof colors],
          },
        ],
      })
    )
    .catch(() => {});

  return {};
});
