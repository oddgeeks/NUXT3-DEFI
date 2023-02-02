import axios from "axios";
const { slackKey, slackErrorKey } = useRuntimeConfig();

const colors: Record<"danger" | "error" | "success" | "banner", string> = {
  danger: "#000000", // black
  error: "#D50201", // red
  success: "#2EA44E", // green
  banner: "#EFC35C", // yellow
};

export default defineEventHandler(async (event) => {
  let { type = "success", message } = await readBody(event);

  if (!slackKey || !slackErrorKey) {
    console.log({
      type,
      message
    })
    return {};
  }

  let channelId = slackKey;

  if (type === "error") {
    channelId = slackErrorKey;
  }

  if(process.env.NODE_ENV === 'development') {
    message += `\n${"`Development`"}`
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
