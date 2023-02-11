<script lang="ts" setup>
import { string } from "yup";
import SVGSuccess from "~/assets/images/icons/check-circle.svg?component";
import SearchSVG from "~/assets/images/icons/search.svg?component";
import type { IToken } from "~~/stores/tokens";

defineEmits(["resolve", "reject", "update:modelValue"]);

const props = defineProps<{
  tokens: IToken[];
  selectedToken: IToken;
}>();

const { tokenBalances } = useAvocadoSafe();
const search = ref("");

const getTokenBalance = (address: string, chainId: string) => {
  const token = tokenBalances.value.find(
    (t) =>
      t.chainId == chainId &&
      t.address.toLocaleLowerCase() === address.toLocaleLowerCase()
  );
  return token ? token.balance : "0";
};

const tokensWithBalance = computed(() => {
  return props.tokens
    .map((i) => {
      return {
        ...i,
        balance: getTokenBalance(i.address, i.chainId),
      };
    })
    .sort((a, b) => toBN(b.balance).minus(toBN(a.balance)).toNumber())
    .filter((i) =>
      !!search.value
        ? i.name.toLowerCase().includes(search.value.toLowerCase()) ||
          i.symbol.toLowerCase().includes(search.value.toLowerCase())
        : true
    );
});
</script>
<template>
  <div>
    <h1 class="text-lg text-center mb-7.5">Select a Token</h1>
    <CommonInput
      v-model="search"
      autofocus
      name="token-search"
      class="px-7.5 mb-5"
      placeholder="Search name"
      type="search"
    >
      <template #prefix>
        <SearchSVG class="text-slate-400 mr-2" />
      </template>
    </CommonInput>
    <ul class="overflow-auto scroll-style h-96">
      <li v-for="token in tokensWithBalance">
        <button
          @click="$emit('resolve', true, token)"
          class="px-5 w-full text-left py-[14px] rounded-3xl flex items-center gap-3 hover:bg-slate-100 hover:dark:bg-slate-800"
        >
          <div
            class="relative inline-block h-10 w-10 rounded-full bg-gray-300 shadow-sm flex-shrink-0"
          >
            <img
              :src="token.logoURI"
              class="h-10 w-10 rounded-full"
              :onerror="onImageError"
            />

            <ChainLogo
              :stroke="true"
              class="w-5.5 h-5.5 absolute -left-1 -bottom-1"
              :chain="token.chainId"
            />
          </div>
          <div class="flex flex-col">
            <span> {{ token.name }} </span>
            <span class="text-slate-400 font-medium text-sm">
              {{ formatDecimal(token.balance) }}
              <span class="uppercase"> {{ token.symbol }}</span>
            </span>
          </div>
          <SVGSuccess
            v-if="token.symbol === selectedToken?.symbol"
            class="selected shrink-0 ml-auto text-white"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.selected :deep(path):first-child {
  @apply fill-green-400 stroke-green-400;
}
</style>
