<script setup lang="ts">
import HomeSVG from '~/assets/images/icons/home.svg'
import ContactSVG from '~/assets/images/icons/contact.svg'
import FireSVG from '~/assets/images/icons/fire.svg'
import CalendarSVG from '~/assets/images/icons/calendar.svg'
import SwapSVG from '~/assets/images/icons/refresh.svg'
import BridgeSVG from '~/assets/images/icons/bridge.svg'
import PlusCircleSVG from '~/assets/images/icons/plus-circle.svg'
import RefreshSVG from '~/assets/images/icons/refresh-2.svg'
import QuestionSVG from '~/assets/images/icons/question-circle-2.svg'

const emit = defineEmits(['itemClicked'])

const { account } = useWeb3()
const { tokenBalances } = useAvocadoSafe()

const priorityChainIds = [1, 137, 42161, 10, 43114, 56, 100]
const priorityTokenKeys = ['ETH', 'MATIC', 'AVAX', 'INST', 'BNB', 'XDAI']
const priorityStable = ['USDC', 'USDT', 'DAI', 'XDAI']

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
    (a, b) => {
      const aIndex = priorityTokenKeys.indexOf(a.symbol.toUpperCase())
      const bIndex = priorityTokenKeys.indexOf(b.symbol.toUpperCase())
      return indexSorter(aIndex, bIndex)
    },
    (a, b) => {
      const aIndex = priorityChainIds.indexOf(Number(a.chainId))
      const bIndex = priorityChainIds.indexOf(Number(b.chainId))
      return indexSorter(aIndex, bIndex)
    },
    (a, b) => {
      const aIndex = priorityStable.indexOf(a.symbol.toUpperCase())
      const bIndex = priorityStable.indexOf(b.symbol.toUpperCase())
      return indexSorter(aIndex, bIndex)
    },
  ])
})

const showOptions = ref(true)

function openSwap() {
  if (sortedBalances.value.length === 0)
    return

  emit('itemClicked')
  openSwapModal(sortedBalances.value[0].address, sortedBalances.value[0].chainId)
}

function openBridge() {
  if (sortedBalances.value.length === 0)
    return

  emit('itemClicked')
  openBridgeModal(sortedBalances.value[0].address, sortedBalances.value[0].chainId)
}

function addCustomToken() {
  emit('itemClicked')
  openImportTokenModal()
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex h-7.5 text-xs">
      <button
        class="flex-1"
        :class="{
          'text-slate-400': !showOptions,
        }"
        @click="showOptions = true"
      >
        Options
      </button>
      <button
        class="flex-1"
        :class="{
          'text-slate-400': showOptions,
        }"
        @click="showOptions = false"
      >
        Authority
      </button>
    </div>
    <div className="flex flex-1 flex-col items-center justify-center dark:bg-gray-950 bg-white rounded-5 p-6 text-sm overflow-y-auto">
      <div v-if="showOptions" className="flex flex-col gap-6 w-full h-full">
        <NuxtLink
          active-class="text-primary"
          class="flex items-center gap-2.5"
          to="/"
          @click="$emit('itemClicked')"
        >
          <HomeSVG class="w-4 h-4" />
          Home Avocado
        </NuxtLink>
        <NuxtLink
          active-class="text-primary"
          class="flex items-center gap-2.5"
          to="/contacts"
          @click="$emit('itemClicked')"
        >
          <ContactSVG class="w-4 h-4" />
          Contacts
        </NuxtLink>
        <NuxtLink
          active-class="text-primary"
          class="flex items-center gap-2.5"
          to="/nft"
          @click="$emit('itemClicked')"
        >
          <FireSVG class="w-4 h-4" />
          View your NFTs
        </NuxtLink>
        <NuxtLink
          class="flex items-center gap-2.5"
          external
          target="_blank"
          :to="`${avoExplorerURL}/address/${account}`"
          @click="$emit('itemClicked')"
        >
          <CalendarSVG class="w-4 h-4" />
          History
        </NuxtLink>
        <button
          class="flex items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openSwap"
        >
          <SwapSVG class="w-4 h-4" />
          Swap
        </button>
        <button
          class="flex items-center gap-2.5"
          :disabled="!tokenBalances || tokenBalances.length === 0"
          @click="openBridge"
        >
          <BridgeSVG class="w-4 h-4" />
          Bridge
        </button>
        <button
          class="flex items-center gap-2.5"
          @click="addCustomToken"
        >
          <PlusCircleSVG class="w-4 h-4" />
          Add custom Tokens
        </button>
        <NuxtLink
          active-class="text-primary"
          class="flex items-center gap-2.5"
          to="/upgrade"
          @click="$emit('itemClicked')"
        >
          <RefreshSVG class="w-4 h-4" />
          Deploy/Upgrade
        </NuxtLink>
        <NuxtLink
          class="flex items-center gap-2.5"
          external
          target="_blank"
          to="https://help.avocado.instadapp.io"
          @click="$emit('itemClicked')"
        >
          <QuestionSVG class="w-4 h-4" />
          Help
        </NuxtLink>
      </div>
      <span v-else class="px-4 py-2.5 text-sm dark:text-slate-500 text-slate-400 rounded-full dark:bg-slate-800 bg-slate-100">Comming soon</span>
    </div>
  </div>
</template>
