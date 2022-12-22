<script setup>
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import SVGX from "~/assets/images/icons/x.svg?component";
import ArrowLeft from "~/assets/images/icons/arrow-left.svg?component";
import ArrowRight from "~/assets/images/icons/arrow-right.svg?component";
import LinkSVG from "~/assets/images/icons/external-link.svg?component";
import SVGWalletConnect from "~/assets/images/wallet/wallet-connect-lite.svg?component";
const { safeAddress } = useAvocadoSafe();
const wcStore = useWalletConnect();

const containerRef = ref(null);
const hasScroll = ref(false);

const { x, arrivedState } = useScroll(
  containerRef,
  {
    behavior: "smooth",
  }
);

const setScrollAvaibility = async () => { 
  if(!containerRef.value) return

  hasScroll.value =
    containerRef.value.scrollWidth > containerRef.value.clientWidth;
    x.value += 1;
}


watch(
  [wcStore, containerRef],
  async () => {
    if (containerRef.value) {
      await nextTick()
      setScrollAvaibility()
    }
  },
  {
    immediate: true,
    deep: true,
  }
);
</script>
<template>
  <div :class="{ 'blur pointer-events-none': !safeAddress }">
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
            class="flex flex-1 w-fit items-center gap-3 p-5 bg-gray-850 rounded-5 py-2.5 pr-[14px] pl-4"
          >
            <div
              class="relative inline-block h-7.5 w-7.5 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
            >
              <img
                v-if="session.peerMeta.icons.length"
                class="w-full h-full object-fit rounded-[inherit]"
                :src="session.peerMeta.icons[session.peerMeta.icons.length - 1]"
              />

              <ChainLogo
                class="w-5 h-5 absolute -left-1 -bottom-1"
                :chain="String(session.chainId)"
              />
            </div>

            <div>
              <h1 class="text-sm whitespace-nowrap">
                {{ session.peerMeta.name }}
              </h1>
              <h2
                class="text-xs text-blue-500 leading-5"
              >
               Connected
              </h2>
            </div>
           <div class="flex items-center gap-2.5">
            <a target="_blank" rel="noopener noreferrer" :href="session.peerMeta.url">
              <LinkSVG class="text-blue-500" />
            </a>
            <button v-tippy="'Disconnect'" @click="openDisconnectWalletModal(session)">
             <SVGX class="text-slate-400" />
            </button>
           </div>
          </div>
        </template>
      </div>
      <div
        v-if="hasScroll && !arrivedState.right"
        class="navigation-pattern absolute right-0 pr-[15px] h-full pointer-events-none"
      >
        <button @click="x += 300" class="arrow-btn ml-auto">
          <ArrowRight />
        </button>
      </div>
    </div>
    <CommonButton
      v-else
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
  @apply flex items-center;
  background: linear-gradient(-180deg, #111827 0%, rgba(17, 24, 39, 0) 100%);
  width: 200px;
}

.navigation-pattern.left {
  background: linear-gradient(90deg, #111827 0%, rgba(17, 24, 39, 0) 100%);
}

.arrow-btn {
  @apply pointer-events-auto flex items-center justify-center h-[30px] w-[30px] bg-slate-750 rounded-full;
}
</style>
