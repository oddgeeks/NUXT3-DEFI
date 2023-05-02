<script setup lang="ts">
onMounted(() => {
  // @ts-expect-error
  window.wc = useWalletConnect()
})
useTokens()
useSafe()

onMounted(() => {
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
    <ClientOnly>
      <div v-if="$pwa.needRefresh" class="flex items-center gap-2.5 fixed right-4 bottom-0">
        <button @click="$pwa.updateServiceWorker(true)">
          Refresh
        </button>
        <SVGInfo class="w-[18px] h-[18px] shrink-0" />
      </div>
    </ClientOnly>
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
