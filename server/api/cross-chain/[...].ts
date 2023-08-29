export default defineEventHandler((event) => {
  const path = event.path.replace('/api/', '')

  return proxyRequest(event, `https://microservices.instadapp.io/api/avocado/${path}`)
})
