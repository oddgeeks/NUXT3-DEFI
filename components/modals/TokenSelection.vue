<script lang="ts" setup>
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import SVGSuccess from '~/assets/images/icons/check-circle.svg?component'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import type { IToken } from '~~/stores/tokens'

const props = defineProps<{
  tokens: IToken[]
  selectedToken: IToken
  sort?: boolean
}>()

defineEmits(['resolve', 'reject', 'update:modelValue'])

const tokens = toRef(props, 'tokens')

const { tokenBalances } = useAvocadoSafe()
const search = ref('')

function getTokenBalance(address: string, chainId: string) {
  const token = tokenBalances.value.find(
    t =>
      t.chainId == chainId
      && t.address.toLocaleLowerCase() === address.toLocaleLowerCase(),
  )
  return token ? token.balance : '0'
}

const computeId = (token: IToken) => `${token.address}-${token.name}-${token.chainId}`

const tokensWithBalance = computed(() => {
  if (!tokens.value)
    return []
  return tokens.value
    .map((i) => {
      return {
        ...i,
        balance: getTokenBalance(i.address, i.chainId),
      }
    })
    .sort((a, b) => {
      if (!props.sort)
        return 0

      const populars = ['eth', 'usdc', 'usdt', 'dai', 'wbtc', 'matic']

      if (toBN(b.balance).gt(toBN(a.balance)))
        return 1
      if (toBN(b.balance).lt(toBN(a.balance)))
        return -1

      const aIndex = populars.indexOf(a.symbol.toLowerCase())
      const bIndex = populars.indexOf(b.symbol.toLowerCase())
      if (aIndex === -1 && bIndex === -1)
        return 0
      if (aIndex === -1)
        return 1
      if (bIndex === -1)
        return -1
      return aIndex - bIndex
    })
    .filter(i =>
      search.value
        ? i.name.toLowerCase().includes(search.value.toLowerCase())
          || i.symbol.toLowerCase().includes(search.value.toLowerCase())
        : true,
    )
})

onMounted(() => {
  const domId = computeId(props.selectedToken)

  const el = document.getElementById(domId)
  if (el)
    el.scrollIntoView()
})
</script>

<template>
  <div>
    <h1 class="mb-7.5 text-center text-lg">
      Select a Token
    </h1>
    <CommonInput
      v-model="search"
      autofocus
      name="token-search"
      class="mb-5 px-7.5"
      placeholder="Search name"
      type="search"
    >
      <template #prefix>
        <SearchSVG class="mr-2 text-gray-400" />
      </template>
    </CommonInput>
    <ul
      v-if="tokensWithBalance.length && tokensWithBalance.length > 0"
      class="scroll-style h-96 overflow-auto"
    >
      <li v-for="token in tokensWithBalance" :id="computeId(token)" :key="computeId(token)">
        <button
          class="flex w-full items-center gap-3 rounded-3xl px-5 py-[14px] text-left  hover:bg-gray-900"
          @click="$emit('resolve', true, token)"
        >
          <SafeTokenLogo :chain-id="token.chainId" :url="token.logoURI" />

          <div class="flex flex-col">
            <span> {{ token.name }} </span>
            <span class="text-sm font-medium text-gray-400">
              {{ formatDecimal(token.balance) }}
              <span class="uppercase"> {{ token.symbol }}</span>
            </span>
          </div>
          <SVGSuccess
            v-if="token.address === selectedToken?.address && String(token?.chainId) === String(selectedToken?.chainId)"
            class="selected ml-auto shrink-0 text-white"
          />
        </button>
      </li>
    </ul>
    <div
      v-else
      class="flex h-96 flex-col items-center justify-center space-y-8"
    >
      <p class="text-gray-400">
        Nothing could be found
      </p>
      <div class="flex flex-col items-center space-y-4">
        <CommonButton
          size="lg"
          class="flex items-center space-x-2"
          @click="openImportTokenModal()"
        >
          <PlusSVG />
          <span>Custom token</span>
        </CommonButton>
        <CommonButton
          color="white"
          size="lg"
          as="NuxtLink"
          href="mailto:info@instadapp.io?subject=Instadapp Avocado: New Token"
        >
          Reach out to us
        </CommonButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.selected :deep(path):first-child {
  @apply fill-green-400 stroke-green-400;
}
</style>
