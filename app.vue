<script setup lang="ts">
import crypto from 'node:crypto'

useTokens()
useSafe()
const { library, account } = useWeb3()
const { public: { chatwootUserIdentificationKey } } = useRuntimeConfig()

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

watch(
  account,
  async () => {
    if (account.value) {
      await until(() => (window as any).$chatwoot as any).changed();

      (window as any).$chatwoot.setUser(account.value.toLowerCase(), {
        name: account.value.toLowerCase(),
        identifier_hash: crypto.createHmac('sha256', chatwootUserIdentificationKey as any).update(account.value.toLowerCase()).digest('hex'),
      })
    }
  }, { immediate: true })

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
