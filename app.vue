<script setup>
onMounted(() => {
  window.wc = useWalletConnect()
})
useTokens()
useSafe()
useEagerConnect();
</script>

<template>
  <div>
    <Html class="h-full bg-[#111827]" />

    <Body class="h-full overflow-y-scroll bg-[#111827] text-white font-semibold" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <Notifications />
  </div>
</template>


<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>