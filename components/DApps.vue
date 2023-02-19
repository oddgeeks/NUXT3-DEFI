<script lang="ts" setup>
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import SVGX from "~/assets/images/icons/x.svg?component";
import ArrowLeft from "~/assets/images/icons/arrow-left.svg?component";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import LinkSVG from "~/assets/images/icons/external-link.svg?component";
import SVGWalletConnect from "~/assets/images/wallet/wallet-connect-lite.svg?component";
import URLWalletConnect from "~/assets/images/wallet/wallet-connect.svg?url";
const { safeAddress, account } = useAvocadoSafe();
const wcStore = useWalletConnect();

const containerRef = ref<any>(null);
const hasScroll = ref(false);

const { x, arrivedState } = useScroll(containerRef, {
  behavior: "smooth",
});

const setScrollAvaibility = async () => {
  if (!containerRef.value) return;

  hasScroll.value =
    containerRef.value.scrollWidth > containerRef.value.clientWidth;
  x.value += 1;
};

const handleDisconnectWallet = async (session: any) => {
  const { success } = await openDialogModal({
    title: "Are you sure you want to disconnect?",
    type: "question",
    headerIconUrl: getSessionIconURL(session),
    isButtonVisible: true,
    isCancelButtonVisible: true,
    buttonText: "Disconnect",
    cancelButtonText: "Cancel",
    cancelButtonProps: {
      color: "white",
    },
    buttonProps: {
      color: "red",
    },
  });

  if (success) {
    wcStore.disconnect(session);
  }

};

const getSessionIconURL = (session: any) => {
  if (session.peerMeta.icons && session.peerMeta.icons.length) {
    return session.peerMeta.icons[0];
  }
  return null;
};

const disconnectAllConnections = async() => {
  const { success } = await openDialogModal({
    title: "Are you sure you want to disconnect all?",
    type: "question",
    headerIconUrl: URLWalletConnect,
    isButtonVisible: true,
    isCancelButtonVisible: true,
    buttonText: "Disconnect All",
    cancelButtonText: "Cancel",
    cancelButtonProps: {
      color: "white",
    },
    buttonProps: {
      color: "red",
    },
  });

  if (success) {
    wcStore.disconnectAll()
  }
};

watch(
  [wcStore, containerRef],
  async () => {
    if (containerRef.value) {
      await nextTick();
      setScrollAvaibility();
    }
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>
<template>
  <div class="flex flex-col items-baseline gap-[15px]" :class="{ 'blur pointer-events-none': !account }">
    <div v-if="wcStore.sessions.length" class="flex gap-3 items-center">
      <h1>Connected Dapps</h1>
      <CommonButton
        v-if="wcStore.sessions.length > 2"
        @click="disconnectAllConnections"
        color="white"
        class="hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
        size="sm"
      >
        Disconnect All
      </CommonButton>
    </div>
    <div
      class="flex items-center relative gap-[15px]"
      v-if="wcStore.sessions.length"
    >
      <CommonButton
        @click="openWalletConnectModal()"
        class="!px-0 shrink-0 py-0 w-10 h-10 flex items-center justify-center"
      >
        <PlusSVG class="w-3 h-3 text-white shrink-0" />
      </CommonButton>
      <div
        v-if="hasScroll && !arrivedState.left"
        class="navigation-pattern left pl-[15px] absolute left-10 z-10 h-full pointer-events-none"
      >
        <button @click="x -= 300" class="arrow-btn">
          <ArrowLeft />
        </button>
      </div>
      <div
        ref="containerRef"
        class="flex items-center relative gap-[15px] scroll-hide overflow-x-auto"
      >
        <template v-for="session in wcStore.sessions">
          <div
            v-if="session.peerMeta"
            class="flex flex-1 items-center gap-3 p-5 dark:bg-gray-850 bg-slate-50 rounded-5 py-2.5 pr-[14px] pl-4"
          >
            <button
              @click="openWalletDetailsModal(session)"
              class="flex text-left gap-3 items-center"
            >
              <div
                class="relative inline-block h-7.5 w-7.5 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
              >
                <img
                  v-if="getSessionIconURL(session)"
                  class="w-full h-full object-fit rounded-[inherit]"
                  referrerpolicy="no-referrer"
                  :src="getSessionIconURL(session)"
                />

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
                  {{ session.peerMeta.name }}
                </h1>
                <h2 class="text-xs text-primary leading-5">Connected</h2>
              </div>
            </button>
            <a
              target="_blank"
              rel="noopener noreferrer"
              :href="session.peerMeta.url"
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
      </div>
      <div
        v-if="hasScroll && !arrivedState.right"
        class="navigation-pattern absolute right-0 pr-[15px] h-full pointer-events-none"
      >
        <button @click="x += 300" class="arrow-btn ml-auto">
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
    <CommonButton
      v-else
      :disabled="!safeAddress"
      size="lg"
      class="flex items-center gap-2 px-5"
      @click="openWalletConnectModal()"
    >
      <PlusSVG />
      Connect Dapps
      <SVGWalletConnect />
    </CommonButton>
  </div>
</template>

<style scoped>
.navigation-pattern {
  @apply flex items-center bg-navigation-pattern dark:bg-navigation-pattern-dark;
  width: 200px;
}

.navigation-pattern.left {
  @apply dark:bg-navigation-pattern-dark-left bg-navigation-pattern-left;
}

.arrow-btn {
  @apply pointer-events-auto flex items-center justify-center h-7.5 w-7.5 bg-slate-150 dark:bg-slate-750 rounded-full;
}


</style>
