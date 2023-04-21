import { promos } from '~~/server/data/promos'

export default defineEventHandler((event) => {
  const promo = promos.find(p => p.slug === event.context.params!.slug)
  if (!promo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Promo Not Found!',
    })
  }

  return promo
})
