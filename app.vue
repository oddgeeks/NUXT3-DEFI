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
const { account } = useWeb3()
watch(
  () => account,
  () => {
    if (account.value) {
      (window as any).$chatwoot.setUser(account.value.toLowerCase(), {
        name: account.value.toLowerCase(),
        email: account.value.toLowerCase(),
      })
    }
  },
)

onMounted(() => {
  (function (d, t) {
    const BASE_URL = 'https://app.chatwoot.com'
    const g: any = d.createElement(t); const s: any = d.getElementsByTagName(t)[0]
    g.src = `${BASE_URL}/packs/js/sdk.js`
    g.defer = true
    g.async = true
    s.parentNode.insertBefore(g, s)
    g.onload = function () {
      (window as any).chatwootSDK.run({
        websiteToken: 'pmgPtAUDhoeVv7h9nS2xk7PF',
        baseUrl: BASE_URL,
      })
    }
  })(document, 'script')
})
</script>

<template>
  <NuxtLayout>
    <NuxtLoadingIndicator color="#07A65D" :height="2" />
    <NuxtPage />
  </NuxtLayout>

  <BannerNewVersion />
  <BannerMultisigOnboard />
  <Notifications />
  <Modals />
</template>

<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>
