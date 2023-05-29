export default defineNuxtRouteMiddleware((to) => {
  if (!process.server) {
    const cachedProviderName = localStorage.getItem('cachedProviderName');
    if (!cachedProviderName && (to.fullPath === "/" || to.fullPath === "/upgrade")) {
      return navigateTo('/login');
    }
  }
});