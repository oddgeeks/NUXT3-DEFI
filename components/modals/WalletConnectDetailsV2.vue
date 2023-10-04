<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'

const props = defineProps<{
  session: SessionTypes.Struct
}>()

const emit = defineEmits(['destroy'])
const wcStoreV2 = useWalletConnectV2()
const [loading, toggle] = useToggle(false)

const iconURL = computed(() => {
  const [icon] = props.session.peer.metadata.icons

  if (icon.startsWith('<svg'))
    return

  return icon
})

async function disconnectWallet() {
  toggle(true)
  await wcStoreV2.disconnect(props.session)
  toggle(false)
  emit('destroy')
}
</script>

<template>
  <div class="flex flex-col gap-9">
    <div class="inline-flex flex-col items-center">
      <div
        v-if="iconURL"
        class="relative inline-block h-10 w-10 shrink-0 rounded-full bg-gray-300 shadow-sm"
      >
        <img
          referrerpolicy="no-referrer"
          height="40"
          width="40"
          class="object-fit h-full w-full rounded-[inherit]"
          :src="iconURL"
        >
      </div>

      <div class="my-4 text-center text-lg">
        {{ props.session.peer.metadata.name }}
      </div>
      <div class="flex flex-col items-center justify-center gap-5">
        <p class="text-center text-xs font-medium leading-5 text-slate-400">
          You need the Avocado web app to be open to initiate transactions.
          Please don't close the tab.
        </p>
        <a
          v-if="props.session.peer.metadata.url"
          rel="noopener noreferrer"
          target="_blank"
          :href="props.session.peer.metadata.url"
          class="max-w-sm truncate text-sm text-primary"
        >
          {{ props.session.peer.metadata.url }}
        </a>
      </div>
    </div>
    <CommonButton
      :loading="loading"
      color="red"
      class="w-full justify-center"
      size="lg"
      @click="disconnectWallet()"
    >
      Disconnect
    </CommonButton>
  </div>
</template>
