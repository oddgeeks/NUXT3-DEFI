<script setup lang="ts">
import { storeToRefs } from 'pinia'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import InfoSVG from '~/assets/images/icons/info.svg?component'
import type { IBalance } from '~~/stores/safe'

const props = defineProps<{
  hideZeroBalances: boolean
}>()

const { totalBalance, tokenBalances } = useAvocadoSafe()
const { account } = useWeb3()
const { networkPreference } = storeToRefs(useSafe())

const whitelistedSymbols = [
  'ETH',
  'USDC',
  'USDT',
  'DAI',
  'INST',
  'MATIC',
  'AVAX',
  'XDAI',
  'BNB',
  'OP',
  'GNO',
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

const search = useDebounceFn((event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value
}, 200)
</script>

<template>
  <div class="relative flex-1">
    <div class="h-full w-full flex flex-col gap-5">
      <div v-if="totalBalance > 0">
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
            <thead v-if="account">
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
              <template v-if="!account || !tokenBalances.length">
                <LoadingBalanceRow
                  v-for="i in 8"
                  :key="i"
                  :loading="!!account && !tokenBalances.length"
                />
              </template>

              <template v-else>
                <BalanceRow
                  v-for="tokenBalance in searchQuery.length > 0
                    ? filteredBalances
                    : sortedBalances"
                  :key="`${tokenBalance.chainId}-${tokenBalance.name}`"
                  :token-balance="tokenBalance"
                />
              </template>
            </tbody>
          </table>
        </div>
        <div class="flex flex-col space-y-4 sm:hidden">
          <MobileBalanceRow
            v-for="tokenBalance in sortedBalances"
            :key="`${tokenBalance.chainId}-${tokenBalance.name}`"
            :token-balance="tokenBalance"
          />
        </div>
      </div>
      <div v-else class="overflow-y-auto overflow-x-auto dark:bg-gray-850 bg-slate-50 rounded-[25px] md:overflow-x-hidden max-h-[530px] hidden sm:flex scroll-style flex flex-col items-center py-[100px] gap-[30px]">
        <div class="flex flex-rows w-2/3 gap-[30px]">
          <StyledQrCode
            :key="account"
            class="rounded-5 bg-white flex items-center justify-center overflow-hidden"
            :size="160"
            :margin="3"
            :data="account"
          />
          <div class="flex-1 flex flex-col gap-[20px]">
            <p class="text-[20px] font-semibold">
              Add tokens to your Avocado wallet
            </p>
            <Copy
              class="px-4 py-3 flex items-center text-xs text-wrap justify-between rounded-5 dark:bg-slate-800 bg-slate-100 gap-2 text-left"
              :text="account"
            >
              <template #content>
                {{ account }}
              </template>
            </Copy>
            <span class="font-semibold inline-flex gap-2.5 text-xs">
              Send tokens on any supported chain to your Avocado Wallet
            </span>
            <SupportedChains class="!flex justify-between" />
          </div>
        </div>
        <div class="bg-[#4CA0541A] w-2/3 rounded-[30px] px-[16px] py-[10px] flex flex-rows gap-[10px] items-center justify-center">
          <InfoSVG />
          <p class="text-[12px] text-[#4CA054] flex-1">
            You have $34.60 of assets spread across 2 networks on your wallet (EOA)
          </p>
          <CommonButton class="text-[12px]">
            Migrate
          </CommonButton>
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
