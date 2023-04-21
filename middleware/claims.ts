import { promos } from '~/server/data/promos'

export default defineNuxtRouteMiddleware(({ params: { slug } }, from) => {
  if (!promos.some(el => el.slug === slug))
    throw createError({ statusCode: 400, statusMessage: 'Promo Not Found', message: 'This promo is invalid or has expired.' })
})
