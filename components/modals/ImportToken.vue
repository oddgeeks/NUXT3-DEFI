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

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
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

function search(event: Event) {
  searchQuery.value = (<HTMLInputElement>event.target).value
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
    <h1 class="text-lg text-center leading-5 mb-5">
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
        <SearchSVG class="text-slate-400 mr-2" />
      </template>
    </CommonInput>
    <div
      v-bind="containerProps"
      class="max-h-[550px] h-[550px] scroll-style overflow-auto relative overflow-y-auto flex flex-col"
    >
      <div>
        <ul v-if="pending" class="flex gap-2 flex-col">
          <li v-for="i in 10" :key="i" class="py-[14px] px-3">
            <div class="flex gap-3 items-center">
              <ChainLogo class="w-10 h-10" />
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
        <ul v-else v-bind="wrapperProps" class="flex gap-2 flex-col pl-3">
          <li
            v-for="token in list"
            :key="`${token.data.chainId}-${token.data.address}`"
            class="py-[14px] px-3 flex justify-between items-center hover:dark:bg-slate-800 rounded-[24px] w-full"
          >
            <div class="flex gap-3 items-center">
              <div
                class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
              >
                <img
                  :src="token.data.logoURI"
                  loading="lazy"
                  class="h-10 w-10 rounded-full"
                  :onerror="onImageError"
                >

                <ChainLogo
                  :stroke="true"
                  class="w-5.5 h-5.5 absolute -left-1 -bottom-1"
                  :chain="token.data.chainId"
                />
              </div>
              <div class="flex flex-col gap-1">
                <span
                  class="leading-5 w-[160px] sm:w-[231px] whitespace-nowrap overflow-hidden text-shadow text-sm sm:text-base"
                >
                  {{ token.data.name }}
                </span>
                <span
                  class="text-slate-400 font-medium leading-5 text-xs sm:text-base"
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
              class="h-fit px-[18px] flex gap-2 items-center !text-primary bg-opacity-10 hover:bg-opacity-100 hover:!text-white"
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
        class="text-slate-400 flex items-center justify-center flex-col gap-[26px] whitespace-nowrap my-auto"
      >
        <p v-if="!filteredTokens.length">
          Nothing could be found
        </p>
        <CommonButton
          class="items-center gap-2 mb-4"
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
