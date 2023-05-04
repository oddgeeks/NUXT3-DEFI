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
import MoreOptionsSVG from '~/assets/images/icons/more-options.svg'
import ChevronDownSVG from '~/assets/images/icons/chevron-down.svg'
import ArrowRight from '~/assets/images/icons/arrow-right.svg'
import CopySVG from '~/assets/images/icons/copy.svg'
import QrSVG from '~/assets/images/icons/qr.svg'

const { opened, toggleSidebar } = useSidebar()
const { safeAddress, tokenBalances } = useAvocadoSafe()
const { copy } = useClipboard()
const { account } = useWeb3()

const [moreOptions, toggleOptions] = useToggle(false)

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

function openSwap() {
  if (sortedBalances.value.length === 0)
    return
  openSwapModal(sortedBalances.value[0].address, sortedBalances.value[0].chainId)
}

function openBridge() {
  if (sortedBalances.value.length === 0)
    return
  openBridgeModal(sortedBalances.value[0].address, sortedBalances.value[0].chainId)
}
</script>

<template>
  <ClientOnly>
    <aside style="scrollbar-gutter:stable;overflow-y:overlay;" class="hidden sm:flex overflow-y-auto scroll-style h-screen dark:bg-gray-850 bg-slate-50 transition-all" :class="{ 'w-[340px]': opened, 'w-[120px]': !opened }">
      <div v-if="opened" class="flex flex-col w-full">
        <div class="flex flex-col border-b-1 dark:border-slate-750 border-slate-150 gap-6 pt-7.5 pb-6 px-7.5">
          <div class="flex items-center justify-between">
            <NuxtLink to="/">
              <Logo />
            </NuxtLink>
            <button
              class="w-7 h-7 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
              @click="toggleSidebar"
            >
              <ArrowRight
                class="w-3.5 h-3.5 text-slate-400"
                :class="{ 'rotate-180': opened }"
              />
            </button>
          </div>
          <div class="flex">
            <QrCode />
          </div>
          <div class="flex flex-col items-start gap-3">
            <SupportedChains :account="account" :max-count="6" class="!flex justify-between !gap-3" />
            <button class="text-primary text-xs" @click="openSupportedNetworks">
              View All Supported EVM Networks
            </button>
          </div>
        </div>
        <div class="flex flex-col gap-2 border-b-1 dark:border-slate-750 border-slate-150 px-7.5 py-4 text-slate-400 font-base">
          <NuxtLink
            active-class="text-primary"
            class="flex h-11 items-center gap-2.5"
            to="/"
          >
            <HomeSVG class="w-4 h-4" />
            Home
          </NuxtLink>
          <NuxtLink
            active-class="text-primary"
            class="flex h-11 items-center gap-2.5"
            to="/contacts"
          >
            <ContactSVG class="w-4 h-4" />
            Contacts
          </NuxtLink>
          <NuxtLink
            active-class="text-primary"
            class="flex h-11 items-center gap-2.5"
            to="/nft"
          >
            <FireSVG class="w-4 h-4" />
            View your NFTs
          </NuxtLink>
          <NuxtLink
            class="flex h-11 items-center gap-2.5"
            external
            target="_blank"
            :to="`${avoExplorerURL}/address/${account}`"
          >
            <CalendarSVG class="w-4 h-4" />
            History
          </NuxtLink>
        </div>
        <div class="flex flex-col gap-2 border-b-1 dark:border-slate-750 border-slate-150 px-7.5 py-4 text-slate-400">
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
      </div>
      <div v-else class="flex flex-col items-center w-full p-7.5 gap-6 w-full">
        <button
          class="w-7 h-7 rounded-full items-center justify-center flex dark:bg-slate-800 bg-slate-100"
          @click="toggleSidebar"
        >
          <ArrowRight
            class="w-3.5 h-3.5 text-slate-400"
            :class="{ 'rotate-180': opened }"
          />
        </button>
        <div class="flex flex-col w-full gap-4" :class="{ 'blur pointer-events-none': !safeAddress }">
          <button
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'Show Avocado Qrcode',
              placement: 'right',
            }"
            class="flex justify-center items-center dark:bg-slate-800 bg-slate-100 w-full rounded-5 py-4"
            @click="openQrCode"
          >
            <QrSVG class="w-4.5 h-4.5" />
          </button>
          <button
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'Copy Your Avocado Address',
              placement: 'right',
            }"
            class="flex justify-center items-center dark:bg-slate-800 bg-slate-100 w-full rounded-5 py-4"
            @click="copy(safeAddress)"
          >
            <CopySVG class="w-4.5 h-4.5" />
          </button>
        </div>
        <div class="flex flex-col items-center gap-9 dark:bg-slate-800 bg-slate-100 py-6 text-slate-400 w-full rounded-5">
          <NuxtLink
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'Home',
              placement: 'right',
            }"
            active-class="text-primary"
            to="/"
          >
            <HomeSVG class="w-4 h-4" />
          </NuxtLink>
          <NuxtLink
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'Contacts',
              placement: 'right',
            }"
            active-class="text-primary"
            to="/contacts"
          >
            <ContactSVG class="w-4 h-4" />
          </NuxtLink>
          <NuxtLink
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'View your NFTs',
              placement: 'right',
            }"
            active-class="text-primary"
            to="/nft"
          >
            <FireSVG class="w-4 h-4" />
          </NuxtLink>
          <NuxtLink
            v-tippy="{
              arrow: true,
              arrowType: 'round',
              animation: 'fade',
              content: 'History',
              placement: 'right',
            }"
            external
            target="_blank"
            :to="`${avoExplorerURL}/address/${account}`"
          >
            <CalendarSVG class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </aside>
  </ClientOnly>
</template>
