<script setup lang="ts">
useTokens()
useSafe()
const { library, provider, account } = useWeb3()
const { onDisconnect } = useConnectors()
const { lastModal } = useModal()

const { safeAddress } = storeToRefs(useSafe())
const { fromWei } = useBignumber()
const { avoProvider } = useSafe()
const { isMobile, actualWidth } = useSidebar()

const actualWidthInPx = computed(() => `${actualWidth.value ? actualWidth.value : undefined}px`)

const { refresh } = useAsyncData(
  'pending-deposit',
  async () => {
    if (!safeAddress.value)
      return '0'

    const amountInWei = await avoProvider.send('eth_getBalance', [
      safeAddress.value,
      'pending-deposit',
    ])

    return fromWei(amountInWei || '0', 18).toFixed()
  },
  {
    immediate: true,
    server: false,
    watch: [safeAddress],
  },
)

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

  const originalOnMessage: ((event: MessageEvent) => void) | null = window.onmessage

  window.onmessage = function (e) {
    const trustedOrigins = [window.origin, 'https://app.chatwoot.com']

    if (!trustedOrigins.includes(e.origin))
      return

    if (originalOnMessage)
      originalOnMessage(e)
  }
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

useIntervalFn(refresh, 15000)
</script>

<template>
  <Html :class="isMobile && actualWidth ? 'overflow-hidden' : ''">
    <Body :class="isMobile && actualWidth ? 'overflow-hidden' : ''">
      <div class="layout-wrapper h-full">
        <Sidebar />

        <NuxtLayout>
          <NuxtLoadingIndicator color="#07A65D" :height="2" />
          <NuxtPage />
        </NuxtLayout>
      </div>

      <BannerNewVersion />
      <BannerMultisigOnboard />
      <Notifications />
      <TransactionsQueue />
      <Modals />
      <ChatBubble />
    </Body>
  </Html>
</template>

<style>
#__nuxt {
  width: 100%;
  height: 100%;
}

.layout-wrapper {
   transform: translateX(v-bind(actualWidthInPx));
   @apply transition-transform
}

@screen sm {
  .layout-wrapper {
    margin-left: v-bind(actualWidthInPx);
    transform: none;
    @apply transition-[margin-left]
  }
}
</style>
