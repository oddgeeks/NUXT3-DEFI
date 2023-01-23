<script setup lang="ts">
const { props, closeModal } = useModal();
const wcStore = useWalletConnect();
const [loading, toggle] = useToggle(false)

const icon = computed(() => {
  const icons = props.value.session.peerMeta.icons;
  return icons.length ? icons[0] : "";
});

const disconnectWallet = async () => {
  toggle(true)
  await wcStore.disconnect(props.value.session)
  toggle(false)
  closeModal()
};

</script>

<template>
  <div>
    <div class="inline-flex flex-col items-center">
      <img referrerpolicy="no-referrer" height="40" width="40" class="w-10 h-10" :src="icon" />

      <div class="text-lg text-center my-4">
        {{ props.session.peerMeta.name }} <span class="text-green-400">Connected</span>
      </div>
      <div class="flex flex-col gap-5 mb-9 justify-center items-center">
        <div
        class="dark:bg-gray-850 bg-slate-50 px-2 pr-3 py-[5px] inline-flex justify-center items-center space-x-2 rounded-[20px]"
      >
        <ChainLogo class="w-5 h-5" :chain="props.session.chainId" />
        <span class="text-xs text-slate-400 leading-5"
          >{{ chainIdToName(props.session.chainId) }}</span
        >
      </div>
      <p class="text-slate-400 text-xs text-center leading-5 font-medium">
        You need the Avocado web app to be open to popup transactions. Please
        don't close the tab.
      </p>
      <a rel="noopener noreferrer" target="_blank" :href="props.session.peerMeta.url" class="text-blue-500 text-sm">
        {{ props.session.peerMeta.url }}
      </a>
      </div>
    </div>
      <CommonButton :loading="loading" @click="disconnectWallet()" color="red" class="w-full justify-center" size="lg">
        Disconnect
      </CommonButton>
  </div>
</template>
