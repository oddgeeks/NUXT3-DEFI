<script setup>
onMounted(() => {
  window.wc = useWalletConnect()
})
useTokens()
useSafe()
const { tried } = useEagerConnect();

whenever(tried, () => {
  useAccountTrack();
})
</script>

<template>
    <Html />

    <Body class="h-screen dark:bg-gray-950 bg-white dark:text-white text-slate-900 font-semibold" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Modal />
    <Notifications />
</template>


<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>