<script setup lang="ts">
import SwapSVG from '~/assets/images/icons/refresh.svg?component'
import BridgeSVG from '~/assets/images/icons/bridge.svg?component'
import PlusCircleSVG from '~/assets/images/icons/plus-circle.svg?component'
import RefreshSVG from '~/assets/images/icons/refresh-2.svg?component'
import QuestionSVG from '~/assets/images/icons/question-circle-2.svg?component'
import MoreOptionsSVG from '~/assets/images/icons/more-options.svg?component'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg?component'
import type { IBalance } from '~/stores/safe'

const emit = defineEmits(['navigate'])

const { tokenBalances, totalEoaBalance, eoaBalances, fundedEoaNetworks } = useAvocadoSafe()
const { isSafeMultisig } = storeToRefs(useMultisig())
const { authorisedNetworks } = useAuthorities()
const [moreOptions, toggleOptions] = useToggle(false)
const { safeAddress } = useAvocadoSafe()
const { navigations } = useNavigation()

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
  <div :class="{ 'blur pointer-events-none': !safeAddress }">
    <div class="flex flex-col w-full gap-2 border-y-1 dark:border-slate-750 border-slate-150 px-7.5 py-4 text-slate-400 font-base">
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
          <component :is="nav.icon" class="w-4 h-4" />
          {{ nav.label }}
          <span v-if="nav?.count" class="flex items-center justify-center min-w-[20px] h-5 px-[5px] bg-slate-500 text-xs rounded-full text-white">
            {{ nav?.count }}
          </span>
        </NuxtLink>
      </template>
    </div>
    <div class="flex flex-col w-full gap-2 border-b-1 dark:border-slate-750 border-slate-150 px-7.5 py-4 text-slate-400">
      <button
        class="flex h-11 items-center justify-between"
        :class="{
          'dark:text-white text-slate-900': moreOptions,
        }"
        @click="toggleOptions(!moreOptions)"
      >
        <div class="flex items-center gap-2.5">
          <MoreOptionsSVG class="w-4 h-4" />
          More options
        </div>
        <ChevronDownSVG
          class="w-4 h-4"
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
          <SwapSVG class="w-4 h-4" />
          Swap
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openBridge"
        >
          <BridgeSVG class="w-4 h-4" />
          Bridge
        </button>
        <button
          class="flex h-11 items-center gap-2.5"
          @click="openImportTokenModal"
        >
          <PlusCircleSVG class="w-4 h-4" />
          Add custom Tokens
        </button>
        <NuxtLink
          active-class="text-primary"
          class="flex h-11 items-center gap-2.5"
          to="/upgrade"
        >
          <RefreshSVG class="w-4 h-4" />
          Deploy/Upgrade
        </NuxtLink>
        <NuxtLink
          class="flex h-11 items-center gap-2.5"
          external
          target="_blank"
          to="https://help.avocado.instadapp.io"
        >
          <QuestionSVG class="w-4 h-4" />
          Help
        </NuxtLink>
      </div>
    </div>
    <div v-if="eoaBalances && eoaBalances?.length && !isSafeMultisig" class="flex flex-col py-6 px-7.5 text-xs gap-[14px]">
      <span class="text-slate-400 text-center sm:text-left">You have {{ formatUsd(totalEoaBalance?.toNumber()) }} of assets spread across {{ fundedEoaNetworks }} networks on your wallet (EOA)</span>
      <div class="flex justify-center sm:justify-start">
        <CommonButton
          size="sm"
          as="NuxtLink"
          external
          target="_blank"
          class="bg-opacity-[14%] !text-primary hover:bg-opacity-20 py-2"
          :to="avoOnboardURL"
        >
          Transfer funds into your Avocado Wallet
        </CommonButton>
      </div>
    </div>
  </div>
</template>
