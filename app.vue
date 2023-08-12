<script setup lang="ts">
useTokens()
useSafe()
const { library } = useWeb3()

onMounted(() => {
  (window as any).library = library
  const hideAllTooltipsOnScroll = useThrottleFn(() => {
    [...document.querySelectorAll('[data-tippy-root]')].forEach(e =>
    // @ts-expect-error
      e._tippy?.hide(),
    )
  }, 1000)

  document.addEventListener('scroll', hideAllTooltipsOnScroll, true)

  return () => document.removeEventListener('scroll', hideAllTooltipsOnScroll)
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#16A34A" :height="2" />
    <NuxtPage />
  </NuxtLayout>

  <BannerNewVersion />
  <Notifications />
  <Modals />
</template>

<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>
