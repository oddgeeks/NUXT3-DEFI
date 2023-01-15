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
    <NuxtLayout>
      <NuxtLoadingIndicator color="#3b82f6" height="2" />
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