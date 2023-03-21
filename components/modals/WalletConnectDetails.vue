<script setup lang="ts">
import { RPC_URLS } from "~~/connectors";

const { safeAddress } = useAvocadoSafe();
const wcStore = useWalletConnect();
const [loading, toggle] = useToggle(false);

const emit = defineEmits(["destroy"]);
const props = defineProps<{
  session: any;
}>();

const { networks } = useNetworks();

const chainId = ref(props.session.chainId);

const icon = computed(() => {
  const icons = props.session.peerMeta.icons;
  return icons.length ? icons[0] : "";
});

const disconnectWallet = async () => {
  toggle(true);
  await wcStore.disconnect(props.session);
  toggle(false);
  emit("destroy");
};

watch(chainId, async () => {
  const wc = wcStore.sessions.find(
    (s) => s.session.peerId === props.session.peerId
  );

  if (!wc) return;

  try {
    await wc.updateSession({
      chainId: chainId.value,
      networkId: chainId.value,
      rpcUrl: RPC_URLS[chainId.value],
      accounts: [safeAddress.value],
    });

    wcStore.refreshSessions();

    openSnackbar({
      message: "Network changed successfully",
      type: "success",
    });
  } catch (e) {
    console.log(e);
  }
});
</script>

<template>
  <div class="flex flex-col gap-9">
    <div class="inline-flex flex-col items-center">
      <img
        referrerpolicy="no-referrer"
        height="40"
        width="40"
        class="w-10 h-10"
        :src="icon"
      />

      <div class="text-lg text-center my-4">
        {{ props.session.peerMeta.name }}
        <span class="text-green-400">Connected</span>
      </div>
      <div class="flex flex-col gap-5 justify-center items-center">
        <div
          class="dark:bg-gray-850 bg-slate-50 px-2 pr-3 py-[5px] inline-flex justify-center items-center space-x-2 rounded-[20px]"
        >
          <ChainLogo class="w-5 h-5" :chain="chainId" />
          <span class="text-xs text-slate-400 leading-5">{{
            chainIdToName(chainId)
          }}</span>
        </div>

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
      class="w-full"
      v-model="chainId"
      value-key="chainId"
      label-key="name"
      :options="networks"
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
      @click="disconnectWallet()"
      color="red"
      class="w-full justify-center"
      size="lg"
    >
      Disconnect
    </CommonButton>
  </div>
</template>
