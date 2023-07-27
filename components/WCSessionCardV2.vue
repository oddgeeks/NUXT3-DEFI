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

  return icon
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
    class="flex flex-1 items-center sm:justify-normal justify-between gap-3 p-5 dark:bg-gray-850 bg-slate-50 rounded-5 py-2.5 pr-[14px] pl-4"
  >
    <button
      class="flex text-left gap-3 items-center"
      @click="openWalletDetailsModalV2(session)"
    >
      <div
        class="relative inline-block h-7.5 w-7.5 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
      >
        <img
          class="w-full h-full object-fit rounded-[inherit]"
          referrerpolicy="no-referrer"
          :src="iconURL"
        >
      </div>

      <div>
        <h1
          class="text-sm overflow-hidden whitespace-nowrap text-shadow sm:w-[148px] w-[200px]"
        >
          {{ session?.peer.metadata.name }}
        </h1>
        <h2 class="text-xs text-primary leading-5">
          Connected v2
        </h2>
      </div>
    </button>
    <div class="flex items-center gap-3">
      <a
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
        <SVGX class="text-slate-400 h-[18px] w-[18px]" />
      </button>
    </div>
  </div>
</template>
