<script setup lang="ts">
const props = defineProps<{
  session: any
}>()
const emit = defineEmits(['destroy'])
const { safeAddress } = useAvocadoSafe()
const wcStore = useWalletConnect()
const [loading, toggle] = useToggle(false)

const chainId = ref(props.session.chainId)

const icon = computed(() => {
  const icons = props.session.peerMeta.icons
  return icons.length ? icons[0] : ''
})

async function disconnectWallet() {
  toggle(true)
  await wcStore.disconnect(props.session)
  toggle(false)
  emit('destroy')
}

watch(chainId, async () => {
  const wc = wcStore.sessions.find(
    s => s.session.peerId === props.session.peerId,
  )

  if (!wc)
    return

  try {
    await wc.updateSession({
      chainId: chainId.value,
      networkId: chainId.value,
      rpcUrl: getRpcURLByChainId(chainId.value),
      accounts: [safeAddress.value],
    })

    wcStore.refreshSessions()

    openSnackbar({
      message: 'Network changed successfully',
      type: 'success',
    })
  }
  catch (e) {
    console.log(e)
    openSnackbar({
      message: 'Failed to change network',
      type: 'error',
    })
  }
})
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
          :src="icon"
        >

        <ChainLogo
          class="w-5 h-5 absolute -left-1 -bottom-1"
          :chain="String(session.chainId)"
        />
      </div>

      <div class="text-lg text-center my-4">
        {{ props.session.peerMeta.name }}
      </div>
      <div class="flex flex-col gap-5 justify-center items-center">
        <p class="text-slate-400 text-xs text-center leading-5 font-medium">
          You need the Avocado web app to be open to initiate transactions.
          Please don't close the tab.
        </p>
        <a
          rel="noopener noreferrer"
          target="_blank"
          :href="props.session.peerMeta.url"
          class="text-primary text-sm"
        >
          {{ props.session.peerMeta.url }}
        </a>
      </div>
    </div>
    <CommonSelect
      v-model="chainId"
      class="w-full"
      value-key="chainId"
      label-key="name"
      :options="availableNetworks"
    >
      <template #button-prefix>
        <ChainLogo class="w-6 h-6" :chain="chainId" />
      </template>
      <template #item-prefix="{ value }">
        <ChainLogo class="w-6 h-6" :chain="value" />
      </template>
    </CommonSelect>
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
