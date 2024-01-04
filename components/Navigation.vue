<script setup lang="ts">
import SwapSVG from '~/assets/images/icons/refresh.svg'
import BridgeSVG from '~/assets/images/icons/bridge.svg'
import PlusCircleSVG from '~/assets/images/icons/plus-circle.svg'
import RefreshSVG from '~/assets/images/icons/refresh-2.svg'
import QuestionSVG from '~/assets/images/icons/question-circle-2.svg'
import MoreOptionsSVG from '~/assets/images/icons/more-options.svg'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg'
import type { IBalance } from '~/stores/safe'

const emit = defineEmits(['navigate'])

const { tokenBalances, totalEoaBalance, eoaBalances, fundedEoaNetworks } = useAvocadoSafe()
const { isSelectedSafeLegacy } = storeToRefs(useSafe())
const { public: { isVercelProd } } = useRuntimeConfig()
const { avoOnboardURL, isProd } = storeToRefs(useEnvironmentState())
const { isAppProduction } = storeToRefs(useShared())
const { isOnboardBannerVisible } = useBanner()
const { authorisedNetworks } = useAuthorities()
const [moreOptions, toggleOptions] = useToggle(false)
const { safeAddress } = useAvocadoSafe()
const { navigations } = useNavigation()

const router = useRouter()

const sortedBalances = computed(() => {
  return sortByMany<IBalance>(tokenBalances.value, [
    (a, b) =>
      toBN(b?.balanceInUSD || 0)
        .minus(a?.balanceInUSD || 0)
        .toNumber(),
    (a, b) =>
      toBN(b?.balance || 0)
        .minus(a?.balance || 0)
        .toNumber(),
  ])
})

const toggleEnv = computed({
  get: () => isProd.value,
  set: (value) => {
    isAppProduction.value = value
    router.go(0)
  },
})

const firstAvailableChain = computed(() => authorisedNetworks.value?.length ? authorisedNetworks.value[0]?.chainId : 1)
const firstAvailableToken = computed(() => sortedBalances.value.find(b => String(b.chainId) == String(firstAvailableChain.value)))

function openSwap() {
  if (sortedBalances.value.length === 0)
    return

  if (!firstAvailableToken.value)
    return

  openSwapModal(firstAvailableToken.value?.address, firstAvailableChain.value)
}

function openBridge() {
  if (sortedBalances.value.length === 0)
    return

  if (!firstAvailableToken.value)
    return

  openBridgeModal(firstAvailableToken.value?.address, firstAvailableChain.value)
}
</script>

<template>
  <div :class="{ 'pointer-events-none blur': !safeAddress }">
    <div class="font-base flex w-full flex-col gap-2 border-y-1 border-slate-750 px-7.5 py-4 text-gray-400">
      <CommonButton v-if="isSelectedSafeLegacy" as="NuxtLink" to="/migration" size="lg" class="justify-center">
        Avo Migration
      </CommonButton>
      <template
        v-for="nav in navigations"
        :key="nav.to"
      >
        <NuxtLink
          v-if="!nav.hidden"
          active-class="text-primary"
          class="flex h-11 items-center gap-2.5"
          :to="nav.to"
          :external="nav.external"
          :target="nav.target"
          @click="emit('navigate')"
        >
          <component :is="nav.icon" class="h-4 w-4" />
          {{ nav.label }}
          <span v-if="nav?.count" class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-500 px-[5px] text-xs text-white">
            {{ nav?.count }}
          </span>
        </NuxtLink>
      </template>
    </div>
    <div class="flex w-full flex-col gap-2 border-b-1 border-slate-750 px-7.5 py-4 text-gray-400">
      <button
        class="flex h-11 items-center justify-between"
        :class="{
          'text-white': moreOptions,
        }"
        @click="toggleOptions(!moreOptions)"
      >
        <div class="flex items-center gap-2.5">
          <MoreOptionsSVG class="h-4 w-4" />
          More options
        </div>
        <ChevronDownSVG
          class="h-4 w-4"
          :class="{
            'rotate-180': moreOptions,
          }"
        />
      </button>
      <div v-if="moreOptions" class="flex flex-col gap-2">
        <button
          class="flex h-11 items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openSwap"
        >
          <SwapSVG class="h-4 w-4" />
          Swap
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openBridge"
        >
          <BridgeSVG class="h-4 w-4" />
          Bridge
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          @click="openImportTokenModal"
        >
          <PlusCircleSVG class="h-4 w-4" />
          Add custom Tokens
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          @click="openTransactionShortcutsModal()"
        >
          <SvgoBookmark class="h-4 w-4" />
          Transaction Shortcuts
        </button>
        <NuxtLink
          active-class="text-primary"
          class="flex h-11 items-center gap-2.5"
          to="/upgrade"
        >
          <RefreshSVG class="h-4 w-4" />
          Deploy/Upgrade
        </NuxtLink>
        <NuxtLink
          class="flex h-11 items-center gap-2.5"
          external
          target="_blank"
          to="https://onboard.avocado.instadapp.io/"
        >
          <SvgoRocket class="h-4 w-4" />
          Onboard
        </NuxtLink>
        <NuxtLink
          active-class="text-primary"
          class="flex h-11 items-center gap-2.5"
          to="/migration"
        >
          <SvgoArrowRight class="h-4 w-4" />
          Avo Migration
        </NuxtLink>
        <NuxtLink
          class="flex h-11 items-center gap-2.5"
          external
          target="_blank"
          to="https://guides.avocado.instadapp.io"
        >
          <QuestionSVG class="h-4 w-4" />
          Help
        </NuxtLink>
      </div>
    </div>
    <div v-if="!isVercelProd" class="flex w-full flex-col gap-2  px-7.5 py-4 text-slate-400">
      <CommonToggle v-model="toggleEnv" text-classes="!text-base !text-gray-400" text="Use Production" />
    </div>
    <div v-if="eoaBalances && eoaBalances?.length && isOnboardBannerVisible" class="flex flex-col gap-[14px] px-7.5 py-6 text-xs">
      <span class="text-center text-gray-400 sm:text-left">You have {{ formatUsd(totalEoaBalance?.toNumber()) }} of assets spread across {{ fundedEoaNetworks }} networks on your wallet (EOA)</span>
      <div class="flex justify-center sm:justify-start">
        <CommonButton
          size="sm"
          as="NuxtLink"
          external
          target="_blank"
          class="bg-opacity-[14%] py-2 !text-primary hover:bg-opacity-20"
          :to="avoOnboardURL"
        >
          Transfer funds into your Avocado Wallet
        </CommonButton>
      </div>
    </div>
  </div>
</template>
