export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  return {
    provide: {
      avocadoChainId: config.public.avocadoChainId,
    },
  };
});
