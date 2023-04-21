export default defineEventHandler(async (event) => {
  const slug = event.context.params!.slug

  return sendRedirect(event, `/c/${slug}`, 302)
})
