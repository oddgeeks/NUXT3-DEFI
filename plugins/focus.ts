export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("focus", {
    mounted(el: HTMLElement, binding) {
      const enabled = binding.value?.enabled ?? true;

      if (!enabled) return;

      setTimeout(() => {
        el.focus();
      }, 0);
    },
  });
});
