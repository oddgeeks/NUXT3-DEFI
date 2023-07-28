<script lang="ts" setup>
import { Splide, SplideSlide } from '@splidejs/vue-splide'
import '@splidejs/vue-splide/css'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
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
  <div>
    <div class="flex gap-3 items-center mb-7.5">
      <CommonButton
        :disabled="!safeAddress"
        size="lg"
        class="flex items-center justify-center gap-2 px-5 w-full sm:w-fit"
        @click="openWalletConnectModal()"
      >
        <PlusSVG />
        Connect Dapps
        <SVGWalletConnect />
      </CommonButton>
      <CommonButton
        v-if="isAnySessionAvailable"
        color="white"
        class="hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
        size="sm"
        @click="disconnectAllConnections"
      >
        Disconnect All
      </CommonButton>
    </div>
    <div
      v-if="isAnySessionAvailable"
    >
      <div :class="wcStoreV2.sessions?.length > 3 ? 'px-10' : ''">
        <Splide :options="{ pagination: false, arrows: wcStoreV2.sessions?.length > 3, gap: '16px', autoWidth: true, arrowPath: 'M2 20.9997L40 20.9997M40 20.9997L21 2M40 20.9997L21 40' }">
          <SplideSlide v-for="session in wcStoreV2.sessions" :key="session.peer.metadata.url">
            <WCSessionCardV2 :session="session" />
          </SplideSlide>
        </Splide>
      </div>
    </div>
  </div>
</template>
