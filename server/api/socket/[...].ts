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
      'api-key': config.socketApiKey || '645b2c8c-5825-4930-baf3-d9b997fcd88c',
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
