<script lang="ts" setup>
import PlusSVG from '~/assets/images/icons/plus.svg'
import SVGX from '~/assets/images/icons/x.svg'
import ArrowLeft from '~/assets/images/icons/arrow-left.svg'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import LinkSVG from '~/assets/images/icons/external-link.svg'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg'
import URLWalletConnect from '~/assets/images/wallet/wallet-connect.svg?url'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg'

const { safeAddress, account } = useAvocadoSafe()
const wcStore = useWalletConnect()

const containerRef = ref<any>(null)
const hasScroll = ref(false)

const { x, arrivedState } = useScroll(containerRef, {
  behavior: 'smooth',
})

async function setScrollAvaibility() {
  if (!containerRef.value)
    return

  hasScroll.value
    = containerRef.value.scrollWidth > containerRef.value.clientWidth
  x.value += 1
}

async function handleDisconnectWallet(session: any) {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to disconnect?',
    type: 'question',
    headerIconUrl: getSessionIconURL(session),
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
    wcStore.disconnect(session)
}

function getSessionIconURL(session: any) {
  if (session.peerMeta.icons && session.peerMeta.icons.length)
    return session.peerMeta.icons[0]

  return null
}

async function disconnectAllConnections() {
  const { success } = await openDialogModal({
    title: 'Are you sure you want to disconnect all?',
    type: 'question',
    headerIconUrl: URLWalletConnect,
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
    wcStore.disconnectAll()
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
  },
)
</script>

<template>
  <div class="flex flex-col items-baseline gap-[15px]">
    <div v-if="wcStore.sessions.length" class="flex gap-3 items-center">
      <h1>Connected Dapps</h1>
      <CommonButton
        v-if="wcStore.sessions.length > 0"
        color="white"
        class="hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
        size="sm"
        @click="disconnectAllConnections"
      >
        Disconnect All
      </CommonButton>
    </div>
    <div
      v-if="wcStore.sessions.length"
      class="flex items-center relative gap-[15px] max-w-full"
    >
      <CommonButton
        class="!px-0 shrink-0 py-0 w-10 h-10 flex items-center justify-center"
        @click="openWalletConnectModal()"
      >
        <PlusSVG class="w-3 h-3 text-white shrink-0" />
      </CommonButton>
      <div
        v-if="hasScroll && !arrivedState.left"
        class="navigation-pattern left pl-[15px] absolute left-10 z-10 h-full pointer-events-none"
      >
        <button class="arrow-btn" @click="x -= 300">
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
            :key="session.peerMeta.url"
            class="flex-1 items-center flex gap-3 p-5 dark:bg-gray-850 bg-slate-50 rounded-5 py-2.5 pr-[14px] pl-4"
          >
            <button
              class="flex text-left gap-3 items-center"
              @click="openWalletDetailsModal(session)"
            >
              <div
                class="relative inline-block h-7.5 w-7.5 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
              >
                <img
                  v-if="getSessionIconURL(session)"
                  class="w-full h-full object-fit rounded-[inherit]"
                  referrerpolicy="no-referrer"
                  :src="getSessionIconURL(session)"
                >

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
                <h2 v-if="wcStore.isDappUnsupported(session.peerMeta.url)" class="text-xs leading-5 text-orange-400 flex items-center gap-1">
                  Connected

                  <SVGInfoCircle class="w-3" />
                </h2>
                <h2 v-else class="text-xs leading-5 text-primary">
                  Connected
                </h2>
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
        <button class="arrow-btn ml-auto" @click="x += 300">
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </div>
    <CommonButton
      v-else
      :disabled="!safeAddress"
      size="lg"
      class="flex items-center justify-center gap-2 px-5 w-full sm:w-fit"
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
