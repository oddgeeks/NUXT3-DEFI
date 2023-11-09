<script lang="ts" setup>
import '@splidejs/vue-splide/css'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg?component'

const wcStoreV2 = useWalletConnectV2()

const isAnySessionAvailable = computed(() => wcStoreV2.sessions.length > 0)

const reducedSessions = computed(() => {
  if (!wcStoreV2.sessions?.length)
    return []

  return wcStoreV2.sessions.slice(0, 3)
})
</script>

<template>
  <div
    v-if="isAnySessionAvailable"
  >
    <div class="flex gap-2.5">
      <CommonButton
        class="flex w-full items-center justify-center gap-2 rounded-7.5 !px-4 sm:w-fit"
        @click="openWalletConnectModal()"
      >
        <SVGWalletConnect />
        <SvgoPlus />
      </CommonButton>
      <WCSessionCardV2 v-for="session in reducedSessions" :key="session.peer.metadata.url" :session="session" />
      <button class="flex items-center gap-2.5 rounded-7.5 border px-4 py-2.5 text-xs dark:border-slate-800" @click="openAllDappConnectionsModal">
        View All Connections
        <SvgoChevronDown class="h-3.5 w-3.5 -rotate-90" />
      </button>
    </div>
  </div>
</template>
