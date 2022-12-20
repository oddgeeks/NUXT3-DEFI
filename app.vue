<script setup>
onMounted(() => {
  window.wc = useWalletConnect()
})
useTokens()
useSafe()
useEagerConnect();

</script>

<template>
    <Html class="bg-[#111827]" />

    <Body class="h-screen bg-[#111827] text-white font-semibold" />

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