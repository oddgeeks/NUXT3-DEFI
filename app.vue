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