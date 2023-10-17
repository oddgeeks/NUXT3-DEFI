<script setup lang="ts">
useTokens()
useSafe()
const { library, account, provider } = useWeb3()
const { onDisconnect } = useConnectors()
const isChatwoodReady = ref(false)
const { safeAddress } = useAvocadoSafe()
const { lastModal } = useModal()

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

watchThrottled(
  [safeAddress, isChatwoodReady, account],
  () => {
    if (!safeAddress.value || !isChatwoodReady.value || !account.value)
      return

    const identifier = `${account.value}:${safeAddress.value}`.toLowerCase()

    console.log(identifier)

    // @ts-expect-error
    window.$chatwoot.setUser(identifier, {
      name: account.value,
      email: safeAddress.value,
    })
  }, { immediate: true, throttle: 500 })

onMounted(() => {
  if (process.server)
    return

  window.addEventListener('chatwoot:ready', async () => {
    isChatwoodReady.value = true
  })
})

watchThrottled(provider, () => {
  if (!provider.value)
    return

  provider.value.on('accountsChanged', async () => {
    if (lastModal.value?.id !== 'request-terms-signature') {
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
</template>

<style>
#__nuxt {
  width: 100%;
  height: 100%;
}
</style>
