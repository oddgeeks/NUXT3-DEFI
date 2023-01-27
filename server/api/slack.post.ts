import axios from "axios";
const { slackKey, slackErrorKey } = useRuntimeConfig();

const colors: Record<"danger" | "error" | "success" | "banner", string> = {
  danger: "#000000", // black
  error: "#D50201", // red
  success: "#2EA44E", // green
  banner: "#EFC35C", // yellow
};

export default defineEventHandler(async (event) => {
  if (!slackKey || !slackErrorKey) {
    return {};
  }

  const { type = "success", message } = await readBody(event);

  let channelId = slackKey;

  if (type === "error") {
    channelId = slackErrorKey;
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
