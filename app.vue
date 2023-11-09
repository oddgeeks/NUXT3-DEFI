<script setup lang="ts">
useTokens()
useSafe()
const { library, provider, account } = useWeb3()
const { onDisconnect } = useConnectors()
const { lastModal } = useModal()

useScriptTag('https://app.chatwoot.com/packs/js/sdk.js', () => {
  // @ts-expect-error
  if (!window.chatwootSDK)
    return

  // @ts-expect-error
  window.chatwootSettings = {
    hideMessageBubble: true,
  }

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

watchThrottled(provider, () => {
  if (!provider.value)
    return

  provider.value.on('accountsChanged', async () => {
    const userNonce = useCookie<string | null>(`nonce-${account.value}`)

    if (lastModal.value?.id !== 'request-terms-signature' && !userNonce.value) {
      const { success } = await openRequestTermsSignature()

      if (!success)
        onDisconnect()
    }
  })
}, {
  throttle: 1000,
  immediate: true,
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
  <ChatBubble />
</template>

<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>
