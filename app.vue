<script setup lang=ts>
onMounted(() => {
  window.wc = useWalletConnect()!
})
useTokens()
useSafe()

onMounted(() => {
  const hideAllTooltipsOnScroll = useThrottleFn(() => {
    [...document.querySelectorAll('[data-tippy-root]')].forEach(e =>
      e?._tippy?.hide(),
    )
  }, 1000)

  document.addEventListener('scroll', hideAllTooltipsOnScroll, true)

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('Service Worker registered:', registration)
    }).catch((error) => {
      console.log('Service Worker registration failed:', error)
    })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      alert('New service worker is controlling the client')
      // Show a notification to the user about the new version
    })
  }

  return () => document.removeEventListener('scroll', hideAllTooltipsOnScroll)
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#16A34A" :height="2" />
    <NuxtPage />
  </NuxtLayout>

  <Notifications />
  <Modals />
</template>

<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>
