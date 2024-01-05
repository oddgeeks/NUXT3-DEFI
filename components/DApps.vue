<script lang="ts" setup>
import '@splidejs/vue-splide/css'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg'

const wcStoreV2 = useWalletConnectV2()

const isAnySessionAvailable = computed(() => wcStoreV2.sessions.length > 0)

const reducedSessions = computed(() => {
  if (!wcStoreV2.sessions?.length)
    return []

  return wcStoreV2.sessions.slice(0, 4)
})
</script>

<template>
  <div
    v-if="isAnySessionAvailable"
  >
    <div class="flex items-center gap-2.5">
      <CommonButton
        class="hidden h-fit w-full items-center justify-center gap-2 rounded-7.5 !p-4 sm:flex sm:w-fit"
        @click="openWalletConnectModal()"
      >
        <SVGWalletConnect />
        <SvgoPlus />
      </CommonButton>
      <div class="dapp-wrapper flex items-center gap-2.5">
        <WCSessionCardV2 v-for="session in reducedSessions" :key="session.peer.metadata.url" :session="session" />
      </div>
      <button class="ml-1.5 flex items-center gap-2.5 rounded-7.5 border border-slate-800 px-4 py-[13px] pr-3 text-xs" @click="openAllDappConnectionsModal">
        View All
        <SvgoChevronDown class="h-3.5 w-3.5 -rotate-90" />
      </button>
    </div>
  </div>
</template>

<style>
.dapp-wrapper > div:nth-last-of-type(-n+3) {
    @apply hidden;
  }

@screen sm {
  .dapp-wrapper > div:nth-last-of-type(-n+3) {
    @apply flex;
  }
}
</style>
