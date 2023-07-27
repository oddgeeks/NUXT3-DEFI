<script lang="ts" setup>
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg?component'
import URLWalletConnect from '~/assets/images/wallet/wallet-connect.svg?url'

const { safeAddress } = useAvocadoSafe()
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
</script>

<template>
  <div class="flex flex-col items-baseline gap-7.5">
    <div class="flex gap-7.5 items-center sm:w-auto w-full">
      <CommonButton
        :disabled="!safeAddress"
        size="lg"
        class="flex sm:flex-auto flex-1 items-center justify-center gap-2 px-5 w-full sm:w-fit"
        @click="openWalletConnectModal()"
      >
        <SVGWalletConnect />

        Connect
      </CommonButton>
      <button
        v-if="isAnySessionAvailable"
        type="button"
        class="text-sm text-red-alert sm:flex-auto flex-1"
        @click="disconnectAllConnections"
      >
        Disconnect All
      </button>
    </div>
    <div
      v-if="isAnySessionAvailable"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 items-center relative gap-[15px] w-full"
    >
      <template v-for="session in wcStoreV2.sessions">
        <WCSessionCardV2 v-if="session.peer.metadata" :key="session.peer.metadata.url" :session="session" />
      </template>
    </div>
  </div>
</template>
