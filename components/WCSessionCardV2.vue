<script setup lang="ts">
import type { SessionTypes } from '@walletconnect/types'

const props = defineProps<{
  session: SessionTypes.Struct
  detailed?: boolean
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
</script>

<template>
  <div
    :class="{
      'bg-gray-900': !detailed,
      'border border-gray-800 bg-gray-850 hover:bg-gray-900': detailed,
    }"
    class="flex items-center justify-between gap-3 rounded-2xl p-5 py-2.5 pl-[14px] pr-4 sm:justify-normal"
  >
    <button
      :class="{
        'items-center': !detailed,
        'items-start': detailed,
      }"
      class="flex w-full items-start gap-3 text-left"
      @click="openWalletDetailsModalV2(session)"
    >
      <div
        v-if="iconURL"
        class="relative mt-1 inline-block h-7.5 w-7.5 shrink-0 rounded-full bg-gray-300 shadow-sm"
      >
        <img
          class="object-fit h-full w-full rounded-[inherit]"
          referrerpolicy="no-referrer"
          :src="iconURL"
        >
      </div>

      <div
        :class="{
          'gap-1': detailed,
        }"
        class="flex flex-1 flex-col"
      >
        <h1
          :class="{
            'text-shadow w-[200px] overflow-hidden sm:w-[109px] ': !detailed,
          }"
          class="whitespace-nowrap text-sm"
        >
          {{ session?.peer.metadata.name }}
        </h1>
        <a
          v-if="props.session.peer.metadata.url && detailed"
          rel="noopener noreferrer"
          target="_blank"
          :href="props.session.peer.metadata.url"
          class="max-w-sm truncate text-sm text-gray-400"
          @click.stop
        >
          {{ props.session.peer.metadata.url }}
        </a>
        <h2 class="flex items-center gap-1.5 text-xs leading-5 text-primary">
          <SvgoCheckCircle v-if="detailed" class="success-circle h-4 w-4" />
          Connected
        </h2>
      </div>
      <SvgoInfo2
        v-if="isConnectionWarned"
        v-tippy="{
          content: 'This DApp is known to have some compatability issues with Avocado.',
          maxWidth: 'none',
        }"
        class="cursor-pointer text-orange-400"
      />
    </button>
  </div>
</template>
