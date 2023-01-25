import axios from "axios";
const { slackKey } = useRuntimeConfig()

const colors: Record<'danger' | 'error' | 'success' | 'banner', string> = {
    danger: '#000000', // black
    error: '#D50201', // red
    success: '#2EA44E', // green
    banner: '#EFC35C', // yellow
}

export default defineEventHandler(async (event) => {
    if (!slackKey) {
        return {}
    }

    const { type = "success", message } = await readBody(event)

    await axios
        .post(`https://hooks.slack.com/services/${slackKey}`, JSON.stringify({
            attachments: [
                {
                    text: message,
                    color: colors[type as keyof typeof colors],
                },
            ],
        }))
        .catch(() => { });

    return {}
})