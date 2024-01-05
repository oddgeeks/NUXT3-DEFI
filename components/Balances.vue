<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import InfoSVG from '~/assets/images/icons/info.svg?component'
import type { IBalance } from '~~/stores/safe'
import { useEnvironmentState } from '~~/stores/environment-state'

const props = defineProps<{
  hideZeroBalances: boolean
  listType: string
}>()

const { balances } = storeToRefs(useSafe())
const { isOnboardBannerVisible } = useBanner()
const { totalBalance, tokenBalances, totalEoaBalance, fundedEoaNetworks } = useAvocadoSafe()
const { avoOnboardURL } = storeToRefs(useEnvironmentState())
const { account } = useWeb3()
const { networkPreference } = storeToRefs(useSafe())

const whitelistedSymbols = [
  'ETH',
  'USDC',
  'USDBC',
  'USDT',
  'DAI',
  'INST',
  'MATIC',
  'AVAX',
  'XDAI',
  'BNB',
  'OP',
  'GNO',
  'FUSE',
]

const priorityChainIds = [1, 137, 42161, 10, 43114, 56, 100]
const priorityTokenKeys = ['ETH', 'MATIC', 'AVAX', 'INST', 'BNB', 'XDAI']
const priorityStable = ['USDC', 'USDT', 'DAI', 'XDAI']

const tokensWithBalances = computed(() =>
  tokenBalances.value.filter((tb) => {
    return (
      toBN(tb.balance).gt(0)
      || whitelistedSymbols.includes(tb.symbol.toUpperCase())
    )
  }),
)

const searchQuery = ref('')

const filteredBalances = computed(() => {
  let tokens = tokenBalances.value

  if (!searchQuery.value || searchQuery.value.trim().length === 0)
    tokens = tokensWithBalances.value

  const filters = {
    name: (name: string, token: any) =>
      searchQuery.value
        ? name.toLowerCase().includes(searchQuery.value.toLowerCase())
        || token.symbol.toLowerCase().includes(searchQuery.value.toLowerCase())
        : true,
    balance: (balance: any) =>
      props.hideZeroBalances ? toBN(balance).gt(0) : true,
    chainId: (chainId: string) =>
      (networkPreference.value.length === availableNetworks.length
        ? true
        : networkPreference.value.includes(Number.parseInt(chainId) as any))
        && availableNetworks.some(n => String(n.chainId) == String(chainId)),
  }

  return filterArray(tokens, filters)
})

const sortedBalances = computed(() => {
  return sortByMany<IBalance>(filteredBalances.value, [
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

const groupedBalances = computed(() => {
  const result: { [symbol: string]: IBalance[] } = {}
  const balances = searchQuery.value.length > 0 ? filteredBalances : sortedBalances
  for (const balance of balances.value) {
    const symbol = balance.symbol?.toLowerCase()
    if (!result[symbol])
      result[symbol] = []

    result[symbol].push(balance)
  }
  return result
})

const search = useDebounceFn((e: Event) => {
  const el = e.target as HTMLInputElement
  searchQuery.value = el.value
}, 200)

const { safeAddress } = useAvocadoSafe()
</script>

<template>
  <div class="relative flex-1">
    <div class="flex h-full w-full flex-col gap-5">
      <div v-if="!account || !tokenBalances.length || !isZero(totalBalance) || !balances.data" class="flex h-full w-full flex-col gap-5">
        <CommonInput
          v-if="account"
          name="Token Search"
          type="search"
          placeholder="Search"
          @input="search"
        >
          <template #prefix>
            <SearchSVG class="mr-2 shrink-0" />
          </template>
        </CommonInput>
        <div
          v-if="
            !!account && tokenBalances.length && filteredBalances.length === 0
          "
          class="flex flex-col items-center space-y-4 rounded-[25px] bg-gray-850 py-32"
        >
          <p class="text-gray-400">
            Nothing could be found
          </p>
          <div
            class="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
          >
            <CommonButton
              color="white"
              size="lg"
              as="NuxtLink"
              href="mailto:info@instadapp.io?subject=Instadapp Avocado: New Token"
            >
              Reach out to us
            </CommonButton>
            <CommonButton
              size="lg"
              class="flex items-center space-x-2"
              @click="openImportTokenModal()"
            >
              <PlusSVG />
              <span>Custom token</span>
            </CommonButton>
          </div>
        </div>
        <div
          v-else
          style="scrollbar-gutter: stable; overflow-y: overlay"
          class="scroll-style hidden max-h-[530px] overflow-auto rounded-[25px] bg-gray-850 sm:flex md:overflow-x-hidden"
          :class="{ '!overflow-hidden': !account }"
        >
          <table
            class="table w-full"
            :class="{ 'pointer-events-none blur': !account }"
          >
            <thead>
              <tr
                class="border-b border-gray-800 text-left text-sm text-gray-400"
              >
                <th class="py-6 pl-7.5 text-left font-medium">
                  Token
                </th>
                <th class="py-5 font-medium">
                  Balance
                </th>
                <th class="py-5 text-center font-medium">
                  Last 7d
                </th>
                <th class="py-5 pl-10 font-medium">
                  Price
                </th>
              </tr>
            </thead>
            <tbody class="divide-ydivide-gray-900">
              <template v-if="!account || !tokenBalances.length || !balances.data">
                <LoadingBalanceRow
                  v-for="i in 8"
                  :key="i"
                  :loading="!account || !tokenBalances.length || !balances.data"
                />
              </template>

              <template v-else>
                <template v-if="listType === 'group'">
                  <BalanceGroupRow
                    v-for="(tokenBalance, symbol) in groupedBalances"
                    :key="symbol"
                    :token-balance="tokenBalance"
                  />
                </template>
                <template v-else>
                  <BalanceRow
                    v-for="(tokenBalance) in searchQuery.length > 0 ? filteredBalances : sortedBalances"
                    :key="`${tokenBalance.chainId} - ${tokenBalance.symbol} - ${tokenBalance.address}`"
                    :token-balance="tokenBalance"
                    :summary="false"
                    :hide="false"
                  />
                </template>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="balances.data" class="flex flex-col space-y-4 sm:hidden">
          <div v-if="listType === 'group'" class="flex flex-col space-y-4">
            <MobileBalanceGroupRow
              v-for="(tokenBalance, symbol) in groupedBalances"
              :key="symbol"
              :token-balance="tokenBalance"
            />
          </div>
          <div v-else class="flex flex-col gap-4 rounded-5 bg-gray-850">
            <MobileBalanceRow
              v-for="(tokenBalance, i) in searchQuery.length > 0 ? filteredBalances : sortedBalances"
              :key="i"
              :individual="true"
              :token-balance="tokenBalance"
            />
          </div>
        </div>
      </div>
      <div v-else class="w-full">
        <div class="scroll-style hidden max-h-[530px] flex-col items-center gap-[30px] overflow-auto rounded-[25px]  bg-gray-850 py-8 sm:flex md:overflow-x-hidden lg:py-[100px]">
          <div class="flex w-2/3 flex-col gap-[30px] lg:w-4/5 lg:flex-row xl:w-2/3">
            <StyledQrCode
              :key="safeAddress"
              class="flex items-center justify-center self-center overflow-hidden rounded-5 bg-white"
              :size="160"
              :margin="3"
              :data="safeAddress"
            />
            <div class="flex flex-1 flex-col gap-[20px]">
              <p class="text-[20px] font-semibold">
                Add tokens to your Avocado wallet
              </p>
              <Copy
                class="text-wrap flex items-center justify-between gap-2 rounded-5  bg-gray-900 px-4 py-3 text-left text-xs"
                :text="safeAddress"
              >
                <template #content>
                  {{ safeAddress }}
                </template>
              </Copy>
              <span class="inline-flex gap-2.5 text-xs font-semibold">
                Send tokens on any supported chain to your Avocado Wallet
              </span>
              <SupportedChains class="!flex" />
            </div>
          </div>
          <div v-if="gt(totalEoaBalance || '0', 1) && isOnboardBannerVisible" class="flex-rows flex w-2/3 items-center justify-center gap-[10px] rounded-[30px] bg-primary/10 px-[16px] py-[10px]">
            <InfoSVG />
            <p class="flex-1 text-[12px] text-primary">
              You have {{ formatUsd(totalEoaBalance?.toNumber()) }} of assets spread across {{ fundedEoaNetworks }} networks on your wallet (EOA)
            </p>
            <CommonButton
              size="sm"
              as="NuxtLink"
              external
              target="_blank"
              :to="avoOnboardURL"
            >
              Migrate
            </CommonButton>
          </div>
        </div>
        <div class="flex flex-col space-y-4 sm:hidden">
          <div class="flex flex-1 flex-col items-center justify-center gap-[16px] px-[20px]">
            <p class="text-center text-[16px] font-semibold">
              Add tokens to your Avocado wallet
            </p>
            <Copy
              class="text-wrap flex items-center justify-between gap-2 rounded-5  bg-gray-900 px-4 py-3 text-left text-[14px]"
              :text="safeAddress"
            >
              <template #content>
                {{ shortenHash(safeAddress) }}
              </template>
            </Copy>
            <span class="inline-flex text-center text-xs font-normal">
              Send tokens on any supported chain to your Avocado Wallet
            </span>
            <SupportedChains class="!flex justify-between" :max-count="5" />
          </div>
          <div v-if="gt(totalEoaBalance || '0', 1) && isOnboardBannerVisible" class="flex flex-col gap-[12px] rounded-[20px] bg-primary/10 p-[16px]">
            <p class="flex-1 text-xs text-primary">
              You have {{ formatUsd(totalEoaBalance?.toNumber()) }} of assets spread across {{ fundedEoaNetworks }} networks on your wallet (EOA)
            </p>
            <CommonButton
              size="sm"
              as="NuxtLink"
              external
              class="justify-center"
              target="_blank"
              :to="avoOnboardURL"
            >
              Migrate
            </CommonButton>
          </div>
        </div>
      </div>
      <p
        v-if="account"
        class="mb-5 text-center text-xs leading-5 text-gray-500 sm:mb-0 sm:text-right"
      >
        Don’t see your tokens?
        <button class="text-primary" @click="openImportTokenModal()">
          Add token
        </button>
      </p>
    </div>
  </div>
</template>
