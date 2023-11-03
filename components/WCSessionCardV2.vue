<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'
import SVGX from '~/assets/images/icons/x.svg'
import LinkSVG from '~/assets/images/icons/external-link.svg'

const props = defineProps<{
  session: SessionTypes.Struct
}>()

const wcStoreV2 = useWalletConnectV2()

const iconURL = computed(() => {
  const [icon] = props.session.peer.metadata.icons

  if (icon.startsWith('<svg'))
    return

  return icon
})

const isConnectionWarned = computed(() => {
  const metadataURL = props.session?.peer.metadata.url
  if (!metadataURL)
    return true

  return wcStoreV2.checkDappIsWarned(metadataURL)
})

async function handleDisconnectWallet(session: any) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to disconnect?',
    type: 'question',
    headerIconUrl: iconURL.value,
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
    wcStoreV2.disconnect(session)
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 rounded-5 bg-slate-50 p-5 py-2.5 pl-4 pr-[14px] dark:bg-gray-850 sm:justify-normal"
  >
    <button
      class="flex items-center gap-3 text-left"
      @click="openWalletDetailsModalV2(session)"
    >
      <div
        v-if="iconURL"
        class="relative inline-block h-7.5 w-7.5 shrink-0 rounded-full bg-gray-300 shadow-sm"
      >
        <img
          class="object-fit h-full w-full rounded-[inherit]"
          referrerpolicy="no-referrer"
          :src="iconURL"
        >
      </div>

      <div>
        <h1
          class="text-shadow w-[200px] overflow-hidden whitespace-nowrap text-sm sm:w-[148px]"
        >
          {{ session?.peer.metadata.name }}
        </h1>
        <h2 class="text-xs leading-5 text-primary">
          Connected v2
        </h2>
      </div>
    </button>
    <SvgoInfo2
      v-if="isConnectionWarned" v-tippy="{
        content: 'This DApp is known to have some compatability issues with Avocado.',
        maxWidth: 'none',
      }" class="cursor-pointer text-orange-400"
    />
    <a
      v-if="session?.peer.metadata.url"
      target="_blank"
      rel="noopener noreferrer"
      :href="session?.peer.metadata.url"
    >
      <LinkSVG class="text-primary" />
    </a>
    <button
      v-tippy="'Disconnect'"
      @click="handleDisconnectWallet(session)"
    >
      <SVGX class="h-[18px] w-[18px] text-gray-400" />
    </button>
  </div>
</template>
