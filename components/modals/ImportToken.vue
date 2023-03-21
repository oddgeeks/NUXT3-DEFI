<script setup lang="ts">
import PlusSVG from "~/assets/images/icons/plus.svg?component";
import Fuse from "fuse.js";
import { storeToRefs } from "pinia";
import SearchSVG from "~/assets/images/icons/search.svg?component";
import { IToken } from "~~/stores/tokens";
import { isAddress } from "@ethersproject/address";

const { tokens, customTokens } = storeToRefs(useTokens());
const { handleAddToken, handleDeleteToken } = useTokens();

const searchQuery = ref("");
const loading = ref(false);
const controller = new AbortController();

const emit = defineEmits(["destroy"]);

const { data, pending } = useAsyncData(
  "custom-tokens",
  async () => {
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resp = await http("/api/tokens", {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const filtered = resp.filter((token: IToken) => {
      return (
        !tokens.value.some((t) => {
          return (
            t.address.toLowerCase() === token.address.toLowerCase() &&
            t.chainId == token.chainId &&
            !t.isCustomToken
          );
        }) &&
        !customTokens.value.some((t) => {
          return (
            t.address.toLowerCase() === token.address.toLowerCase() &&
            t.chainId == token.chainId
          );
        })
      );
    }) as IToken[];

    return [...customTokens.value, ...filtered];
  },
  {
    immediate: true,
    default: () => [],
  }
);

const filteredTokens = computed(() => {
  if (!searchQuery.value) return data.value || [];

  const fuse = new Fuse(data.value || [], {
    keys: ["name", "symbol", "address"],
    threshold: 0.2,
  });

  return fuse.search(searchQuery.value).map((result) => result.item);
});

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  filteredTokens,
  {
    itemHeight: 72,
  }
);

const isTokenAlreadyAdded = (address: string, chainId: string) => {
  const token = getToken(address, chainId);

  return !!token;
};

const getToken = (address: string, chainId: string) => {
  const token = customTokens.value?.find(
    (token) =>
      token.address.toLowerCase() === address.toLowerCase() &&
      token.chainId == chainId
  );

  return token;
};

const search = (event: Event) => {
  searchQuery.value = (<HTMLInputElement>event.target).value;
  scrollTo(0);
};

const handleCustomToken = () => {
  emit("destroy");

  const address = isAddress(searchQuery.value) ? searchQuery.value : "";

  openCustomTokenModal(address);
};
</script>

<template>
  <div>
    <h1 class="text-lg text-center leading-5 mb-5">Add Token</h1>
    <CommonInput
      autofocus
      @input="search"
      :modelValue="searchQuery"
      name="token-search"
      class="px-5 pb-4"
      placeholder="Search name, symbol, or address"
      type="search"
    >
      <template #prefix>
        <SearchSVG class="text-slate-400 mr-2" />
      </template>
    </CommonInput>
    <div
      v-bind="containerProps"
      class="max-h-[550px] h-[550px] scroll-style overflow-auto relative overflow-y-auto"
    >
      <ul class="flex gap-2 flex-col" v-if="pending">
        <li :key="i" class="py-[14px] px-3" v-for="i in 10">
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
          class="py-[14px] px-3 flex justify-between items-center hover:dark:bg-slate-800 rounded-[24px] w-full"
          v-for="token in list"
          :key="`${token.data.chainId}-${token.data.address}`"
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
              />

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
              <span class="text-slate-400 font-medium leading-5 text-xs sm:text-base">
                {{ shortenHash(token.data.address) }}</span
              >
            </div>
          </div>
          <CommonButton
            color="red"
            class="h-fit !px-[18px]"
            @click="handleDeleteToken(token.data)"
            v-if="isTokenAlreadyAdded(token.data.address, token.data.chainId)"
          >
            Delete
          </CommonButton>
          <CommonButton
            v-else
            type="button"
            @click="handleAddToken(token.data)"
            class="h-fit px-[18px] flex gap-2 items-center !text-primary bg-opacity-10 hover:bg-opacity-100 hover:!text-white"
          >
            <PlusSVG class="w-2.5" />
            Add
          </CommonButton>
        </li>
        <li class="pointer-events-none opacity-0">placeholder</li>
      </ul>

      <div
        v-if="!pending && !filteredTokens.length"
        class="text-slate-400 absolute flex items-center justify-center flex-col gap-[26px] whitespace-nowrap top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <p>Nothing could be found</p>
        <CommonButton
          class="items-center gap-2"
          :loading="loading"
          @click="handleCustomToken"
          size="lg"
        >
          <PlusSVG class="shrink-0" />
          Custom Token
        </CommonButton>
      </div>
    </div>
  </div>
</template>
