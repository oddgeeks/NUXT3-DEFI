export default defineNuxtRouteMiddleware((to) => {
  if (!process.server) {
    const routesToBeExclude = ['/', '/upgrade'];
    const shouldExclude = routesToBeExclude.some(route => to.fullPath === route);

    if (!localStorage.getItem('cachedProviderName') && shouldExclude) {
      return navigateTo('/login');
    }
  }
});