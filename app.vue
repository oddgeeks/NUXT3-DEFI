<script setup lang="ts">
useTokens()
useSafe()
const { library } = useWeb3()
const isChatwoodReady = ref(false)

useScriptTag('https://app.chatwoot.com/packs/js/sdk.js', () => {
  // @ts-expect-error
  if (!window.chatwootSDK)
    return

  // @ts-expect-error
  window.chatwootSDK.run({
    websiteToken: 'pmgPtAUDhoeVv7h9nS2xk7PF',
    baseUrl: 'https://app.chatwoot.com',
  })
}, {
  async: true,
  defer: true,
  immediate: true,
})

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
  [account, isChatwoodReady],
  () => {
    if (!account.value || !isChatwoodReady.value)
      return

    const identifier = account.value.toLowerCase()

    // @ts-expect-error
    window.$chatwoot.setUser(identifier, {
      name: identifier,
      email: identifier,
    })
  }, { immediate: true })

onMounted(() => {
  if (process.server)
    return

  window.addEventListener('chatwoot:ready', async () => {
    isChatwoodReady.value = true
  })
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
