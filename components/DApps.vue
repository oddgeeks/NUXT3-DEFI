<script lang="ts" setup>
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import ArrowLeft from '~/assets/images/icons/arrow-left.svg?component'
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import SVGWalletConnect from '~/assets/images/wallet/wallet-connect-lite.svg?component'
import URLWalletConnect from '~/assets/images/wallet/wallet-connect.svg?url'

const { safeAddress } = useAvocadoSafe()
const wcStoreV2 = useWalletConnectV2()

const containerRef = ref<any>(null)
const hasScroll = ref(false)

const { x, arrivedState } = useScroll(containerRef, {
  behavior: 'smooth',
})

const isAnySessionAvailable = computed(() => wcStoreV2.sessions.length > 0)

async function setScrollAvaibility() {
  if (!containerRef.value)
    return

  hasScroll.value
    = containerRef.value.scrollWidth > containerRef.value.clientWidth
  x.value += 1
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
    wcStoreV2.disconnectAll()
}

watch(
  [wcStoreV2, containerRef],
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
    <div v-if="isAnySessionAvailable" class="flex gap-3 items-center">
      <CommonButton
        color="white"
        class="hover:!bg-red-alert hover:!bg-opacity-10 hover:text-red-alert"
        size="sm"
        @click="disconnectAllConnections"
      >
        Disconnect All
      </CommonButton>
    </div>
    <div
      v-if="isAnySessionAvailable"
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
        <template v-for="session in wcStoreV2.sessions">
          <WCSessionCardV2 v-if="session.peer.metadata" :key="session.peer.metadata.url" :session="session" />
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
