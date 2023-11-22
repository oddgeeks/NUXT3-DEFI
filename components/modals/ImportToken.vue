<script setup lang="ts">
import Fuse from 'fuse.js'
import { storeToRefs } from 'pinia'
import { isAddress } from '@ethersproject/address'
import PlusSVG from '~/assets/images/icons/plus.svg?component'
import SearchSVG from '~/assets/images/icons/search.svg?component'
import type { IToken } from '~~/stores/tokens'

const emit = defineEmits(['destroy'])
const { tokens, customTokens } = storeToRefs(useTokens())
const { handleAddToken, handleDeleteToken } = useTokens()

const searchQuery = ref('')
const loading = ref(false)
const controller = new AbortController()

const { data, pending } = useAsyncData(
  'custom-tokens',
  async () => {
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const resp = await http('/api/tokens', {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const filtered = resp.filter((token: IToken) => {
      return (
        !tokens.value.some((t) => {
          return (
            t.address.toLowerCase() === token.address.toLowerCase()
            && t.chainId == token.chainId
            && !t.isCustomToken
          )
        })
        && !customTokens.value.some((t) => {
          return (
            t.address.toLowerCase() === token.address.toLowerCase()
            && t.chainId == token.chainId
          )
        })
      )
    }) as IToken[]

    return [...customTokens.value, ...filtered]
  },
  {
    immediate: true,
    default: () => [],
  },
)

const filteredTokens = computed(() => {
  if (!searchQuery.value)
    return data.value || []

  const fuse = new Fuse(data.value || [], {
    keys: ['name', 'symbol', 'address'],
    threshold: 0.2,
  })

  return fuse.search(searchQuery.value).map(result => result.item)
})

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList<IToken>(
  filteredTokens,
  {
    itemHeight: 88,
  },
)

function isTokenAlreadyAdded(address: string, chainId: string) {
  const token = getToken(address, chainId)

  return !!token
}

function getToken(address: string, chainId: string) {
  const token = customTokens.value?.find(
    token =>
      token.address.toLowerCase() === address.toLowerCase()
      && token.chainId == chainId,
  )

  return token
}

function search(e: Event) {
  const el = e.target as HTMLInputElement
  searchQuery.value = el.value
  scrollTo(0)
}

function handleCustomToken() {
  emit('destroy')

  const address = isAddress(searchQuery.value) ? searchQuery.value : ''

  openCustomTokenModal(address)
}
</script>

<template>
  <div>
    <h1 class="mb-5 text-center text-lg leading-5">
      Add Token
    </h1>
    <CommonInput
      autofocus
      :model-value="searchQuery"
      name="token-search"
      class="px-5 pb-4"
      placeholder="Search name, symbol, or address"
      type="search"
      @input="search"
    >
      <template #prefix>
        <SearchSVG class="mr-2 text-gray-400" />
      </template>
    </CommonInput>
    <div
      v-bind="containerProps"
      class="scroll-style relative flex h-[550px] max-h-[550px] flex-col overflow-auto"
    >
      <div>
        <ul v-if="pending" class="flex flex-col gap-2">
          <li v-for="i in 10" :key="i" class="px-3 py-[14px]">
            <div class="flex items-center gap-3">
              <ChainLogo class="h-10 w-10" />
              <div class="flex flex-col gap-1">
                <span
                  style="width: 80px; height: 20px"
                  class="loading-box rounded-lg"
                />
                <span
                  style="width: 143px; height: 20px"
                  class="loading-box rounded-lg"
                />
              </div>
            </div>
          </li>
        </ul>
        <ul v-else v-bind="wrapperProps" class="flex flex-col gap-2 pl-3">
          <li
            v-for="token in list"
            :key="`${token.data.chainId}-${token.data.address}`"
            class="flex w-full items-center justify-between rounded-[24px] px-3 py-[14px] hover:bg-gray-900"
          >
            <div class="flex items-center gap-3">
              <SafeTokenLogo :chain-id="token.data.chainId" :url="token.data.logoURI" />

              <div class="flex flex-col gap-1">
                <span
                  class="text-shadow w-[160px] overflow-hidden whitespace-nowrap text-sm leading-5 sm:w-[231px] sm:text-base"
                >
                  {{ token.data.name }}
                </span>
                <span
                  class="text-xs font-medium leading-5 text-gray-400 sm:text-base"
                >
                  {{ shortenHash(token.data.address) }}</span>
              </div>
            </div>
            <CommonButton
              v-if="isTokenAlreadyAdded(token.data.address, token.data.chainId)"
              color="red"
              class="h-fit !px-[18px]"
              @click="handleDeleteToken(token.data)"
            >
              Delete
            </CommonButton>
            <CommonButton
              v-else
              type="button"
              class="flex h-fit items-center gap-2 bg-opacity-10 px-[18px] !text-primary hover:bg-opacity-100 hover:!text-white"
              @click="handleAddToken(token.data)"
            >
              <PlusSVG class="w-2.5" />
              Add
            </CommonButton>
          </li>
          <li class="pointer-events-none opacity-0">
            placeholder
          </li>
        </ul>
      </div>
      <div
        v-if="!pending"
        class="my-auto flex flex-col items-center justify-center gap-[26px] whitespace-nowrap text-gray-400"
      >
        <p v-if="!filteredTokens.length" class="text-center text-sm font-medium">
          We couldn't find your token. Please use the button below to input custom contract address
        </p>
        <CommonButton
          class="mb-4 items-center gap-2"
          :loading="loading"
          size="lg"
          @click="handleCustomToken"
        >
          <PlusSVG class="shrink-0" />
          Custom Token
        </CommonButton>
      </div>
    </div>
  </div>
</template>
