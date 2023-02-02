<script setup>
const info = useBuildInfo()
console.log({
  info: { ...info}
})
onMounted(() => {
  window.wc = useWalletConnect()
})
useTokens()
useSafe()
const { tried } = useEagerConnect();

whenever(tried, () => {
  useAccountTrack();
})

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
    <NuxtLoadingIndicator color="#3b82f6" :height="2" />
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