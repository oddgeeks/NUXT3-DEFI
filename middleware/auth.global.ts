export default defineNuxtRouteMiddleware((to) => {
  if (!process.server) {
    if (!localStorage.getItem('cachedProviderName') && to.fullPath === "/" || !localStorage.getItem('cachedProviderName') && to.fullPath === "/upgrade") {
      return navigateTo('/login')
    }
  }
});