<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import InfoSVG from '~/assets/images/icons/info.svg?component'
import type { IBalance } from '~~/stores/safe'

const props = defineProps<{
  hideZeroBalances: boolean
  listType: string
}>()

const { balances } = storeToRefs(useSafe())
const { isOnboardBannerVisible } = useBanner()
const { totalBalance, tokenBalances, totalEoaBalance, fundedEoaNetworks } = useAvocadoSafe()
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
        : networkPreference.value.includes(parseInt(chainId) as any))
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
    const symbol = balance.symbol
    if (!result[symbol])
      result[symbol] = []

    result[symbol].push(balance)
  }
  return result
})

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value
}, 200)
const { safeAddress } = useAvocadoSafe()
</script>

<template>
  <div class="relative flex-1">
    <div class="h-full w-full flex flex-col gap-5">
      <div v-if="!account || !tokenBalances.length || !isZero(totalBalance) || !balances.data" class="h-full w-full flex flex-col gap-5">
        <CommonInput
          v-if="account"
          name="Token Search"
          type="search"
          placeholder="Search"
          @input="search"
        >
          <template #prefix>
            <SearchSVG class="shrink-0 mr-2" />
          </template>
        </CommonInput>
        <div
          v-if="
            !!account && tokenBalances.length && filteredBalances.length === 0
          "
          class="dark:bg-gray-850 bg-slate-50 rounded-[25px] flex flex-col space-y-4 items-center py-32"
        >
          <p class="text-slate-400">
            Nothing could be found
          </p>
          <div
            class="flex items-center flex-col space-y-4 sm:space-y-0 sm:flex-row sm:space-x-4"
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
          class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style"
          :class="{ '!overflow-hidden': !account }"
        >
          <table
            class="table w-full"
            :class="{ 'blur pointer-events-none': !account }"
          >
            <thead>
              <tr
                class="text-left text-sm text-gray-400 font-medium border-b border-slate-150 dark:border-slate-800"
              >
                <th class="text-left py-6 pl-7.5">
                  Token
                </th>
                <th class="py-5">
                  Balance
                </th>
                <th class="py-5 text-center">
                  Last 7d
                </th>
                <th class="py-5 pl-10">
                  Price
                </th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-slate-800 divide-slate-150">
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
          <div v-else class="flex flex-col space-y-4">
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
        <div class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style flex-col items-center py-8 lg:py-[100px] gap-[30px]">
          <div class="flex lg:flex-row flex-col w-2/3 lg:w-4/5 xl:w-2/3 gap-[30px]">
            <StyledQrCode
              :key="safeAddress"
              class="rounded-5 bg-white self-center flex items-center justify-center overflow-hidden"
              :size="160"
              :margin="3"
              :data="safeAddress"
            />
            <div class="flex-1 flex flex-col gap-[20px]">
              <p class="text-[20px] font-semibold">
                Add tokens to your Avocado wallet
              </p>
              <Copy
                class="px-4 py-3 flex items-center text-xs text-wrap justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2 text-left"
                :text="safeAddress"
              >
                <template #content>
                  {{ safeAddress }}
                </template>
              </Copy>
              <span class="font-semibold inline-flex gap-2.5 text-xs">
                Send tokens on any supported chain to your Avocado Wallet
              </span>
              <SupportedChains class="!flex" />
            </div>
          </div>
          <div v-if="gt(totalEoaBalance || '0', 1) && isOnboardBannerVisible" class="bg-[#4CA0541A] w-2/3 rounded-[30px] px-[16px] py-[10px] flex flex-rows gap-[10px] items-center justify-center">
            <InfoSVG />
            <p class="text-[12px] text-[#4CA054] flex-1">
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
          <div class="flex-1 flex flex-col gap-[16px] px-[20px] items-center justify-center">
            <p class="text-[16px] font-semibold text-center">
              Add tokens to your Avocado wallet
            </p>
            <Copy
              class="px-4 py-3 flex items-center text-[14px] text-wrap justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2 text-left"
              :text="safeAddress"
            >
              <template #content>
                {{ shortenHash(safeAddress) }}
              </template>
            </Copy>
            <span class="font-normal text-center inline-flex text-[12px] text-xs">
              Send tokens on any supported chain to your Avocado Wallet
            </span>
            <SupportedChains class="!flex justify-between" :max-count="5" />
          </div>
          <div v-if="gt(totalEoaBalance || '0', 1) && isOnboardBannerVisible" class="bg-[#4CA0541A] rounded-[20px] p-[16px] flex flex-col gap-[12px]">
            <p class="text-[12px] text-[#4CA054] flex-1">
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
        class="text-xs leading-5 text-center mb-5 sm:mb-0 sm:text-right dark:text-slate-500 text-slate-400"
      >
        Don’t see your tokens?
        <button class="text-primary" @click="openImportTokenModal()">
          Add token
        </button>
      </p>
    </div>
  </div>
</template>
