<script setup>
onMounted(() => {
  window.wc = useWalletConnect()
})
useTokens()
useSafe()

useAccountTrack(null, () => {
  useEagerConnect();
});

onMounted(() => {
  const hideAllTooltipsOnScroll = useThrottleFn(() => {
    [...document.querySelectorAll("[data-tippy-root]")].forEach((e) => e._tippy?.hide())
  }, 1000)

  document.addEventListener("scroll", hideAllTooltipsOnScroll, true)

  return () => document.removeEventListener("scroll", hideAllTooltipsOnScroll)
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#16A34A" :height="2" />
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