<script setup lang="ts">
import type WalletConnect from '@walletconnect/client'
import SVGX from '~/assets/images/icons/x.svg'
import LinkSVG from '~/assets/images/icons/external-link.svg'

defineProps<{
  session: WalletConnect
}>()

const wcStore = useWalletConnect()

function getSessionIconURL(session: any) {
  if (session.peerMeta.icons && session.peerMeta.icons.length)
    return session.peerMeta.icons[0]

  return null
}

async function handleDisconnectWallet(session: any) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to disconnect?',
    type: 'question',
    headerIconUrl: getSessionIconURL(session),
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
    wcStore.disconnect(session)
}
</script>

<template>
  <div
    class="flex flex-1 items-center gap-3 p-5 dark:bg-gray-850 bg-slate-50 rounded-5 py-2.5 pr-[14px] pl-4"
  >
    <button
      class="flex text-left gap-3 items-center"
      @click="openWalletDetailsModal(session)"
    >
      <div
        class="relative inline-block h-7.5 w-7.5 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
      >
        <img
          v-if="getSessionIconURL(session)"
          class="w-full h-full object-fit rounded-[inherit]"
          referrerpolicy="no-referrer"
          :src="getSessionIconURL(session)"
        >

        <ChainLogo
          class="w-5 h-5 absolute -left-1 -bottom-1"
          :chain="String(session.chainId)"
        />
      </div>

      <div>
        <h1
          style="width: 118px"
          class="text-sm overflow-hidden whitespace-nowrap text-shadow"
        >
          {{ session?.peerMeta?.name }}
        </h1>
        <h2 class="text-xs text-primary leading-5">
          Connected
        </h2>
      </div>
    </button>
    <a
      target="_blank"
      rel="noopener noreferrer"
      :href="session?.peerMeta?.url"
    >
      <LinkSVG class="text-primary" />
    </a>
    <button
      v-tippy="'Disconnect'"
      @click="handleDisconnectWallet(session)"
    >
      <SVGX class="text-slate-400 h-[18px] w-[18px]" />
    </button>
  </div>
</template>
