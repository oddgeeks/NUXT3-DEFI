import { promos } from '~/server/data/promos';

export default defineNuxtRouteMiddleware(({ params: { slug } }, from) => {
  if (!promos.some(el => el.slug === slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found' })
  }
});