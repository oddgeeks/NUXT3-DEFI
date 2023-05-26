export default defineNuxtRouteMiddleware((to) => {
  if (!process.server) {
    if (!localStorage.getItem('cachedProviderName') && to.fullPath === "/") {
      return navigateTo('/login')
    }
  }
});