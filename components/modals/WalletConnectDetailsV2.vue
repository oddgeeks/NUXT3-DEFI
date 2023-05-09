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
        class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
      >
        <img
          referrerpolicy="no-referrer"
          height="40"
          width="40"
          class="w-full h-full object-fit rounded-[inherit]"
          :src="iconURL"
        >
      </div>

      <div class="text-lg text-center my-4">
        {{ props.session.peer.metadata.name }}
      </div>
      <div class="flex flex-col gap-5 justify-center items-center">
        <p class="text-slate-400 text-xs text-center leading-5 font-medium">
          You need the Avocado web app to be open to initiate transactions.
          Please don't close the tab.
        </p>
        <a
          rel="noopener noreferrer"
          target="_blank"
          :href="props.session.peer.metadata.url"
          class="text-primary text-sm"
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
