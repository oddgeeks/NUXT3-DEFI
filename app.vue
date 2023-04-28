<script setup lang=ts>
import { Workbox } from 'workbox-window'

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
    const wb = new Workbox('/sw.js')

    console.log(wb)

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        if (confirm('New content is available!. Click OKi to refreshd'))
          window.location.reload()
      }
    })

    if (!process.dev)
      wb.register()
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.register('/sw.js').then((registration) => {
  //     console.log('Service Worker registeredd:', registration)
  //   }).catch((error) => {
  //     console.log('Service Worker registration failed:', error)
  //   })
  // }

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
