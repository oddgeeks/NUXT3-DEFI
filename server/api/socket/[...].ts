import type { AxiosError } from 'axios'
import axios from 'axios'
import axiosRetry from 'axios-retry'

export const http = axios.create({
  baseURL: 'https://api.socket.tech',
})

axiosRetry(http, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
})

const config = useRuntimeConfig()

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toLowerCase()
  const params: any = getQuery(event)
  const body = method === 'post' ? await readBody(event) : {}
  const url = await getRouterParam(event, '_')

  console.log(url)

  const { data, status, statusText } = await http({
    url,
    method,
    params,
    data: body,
    headers: {
      'api-key': config.socketApiKey || '72a5b4b0-e727-48be-8aa1-5da9d62fe635',
    },
  })
    .catch((err: AxiosError) => {
      return {
        status: err.response?.status || 500,
        statusText: err.response?.statusText || 'error',
        data: err.response?.data,
      }
    })

  event.node.res.statusCode = status
  event.node.res.statusMessage = statusText

  return data
})
