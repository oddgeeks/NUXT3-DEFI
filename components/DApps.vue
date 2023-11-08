<script lang="ts" setup>
import '@splidejs/vue-splide/css'
import URLWalletConnect from '~/assets/images/wallet/wallet-connect.svg?url'

const wcStoreV2 = useWalletConnectV2()

const isAnySessionAvailable = computed(() => wcStoreV2.sessions.length > 0)

async function disconnectAllConnections() {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to disconnect all?',
    type: 'question',
    headerIconUrl: URLWalletConnect,
    isButtonVisible: true,
    isCancelButtonVisible: true,
    buttonText: 'Disconnect',
    cancelButtonText: 'Cancel',
    cancelButtonProps: {
      color: 'white',
    },
    buttonProps: {
      color: 'red',
    },
  })

  if (success)
    wcStoreV2.disconnectAll()
}

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
      <WCSessionCardV2 v-for="session in reducedSessions" :key="session.peer.metadata.url" :session="session" />
      <button class="flex items-center gap-2.5 rounded-7.5 border px-4 py-2.5 text-xs dark:border-slate-800" @click="openAllDappConnectionsModal">
        View All Connections
        <SvgoChevronDown class="h-3.5 w-3.5 -rotate-90" />
      </button>
    </div>
  </div>
</template>
