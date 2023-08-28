import { proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  return proxyRequest(event, 'https://microservices.instadapp.io/api/avocado/cross-chain/estimate')
})
