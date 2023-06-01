<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = defineProps<{
  item: any
  borrow: boolean
}>()

const { tokens } = storeToRefs(useTokens())

function getTokenByKey(key: string) {
  return tokens.value.find(token => token.symbol === key)
}

const token = computed(() => getTokenByKey(props.item.key))

const amount = computed(() => {
  return props.borrow ? props.item.borrow : props.item.supply
})
</script>

<template>
  <li class="flex justify-between items-center py-4.5 px-5 border-b dark:border-b-slate-800 last:border-b-0">
    <span class="uppercase flex items-center gap-3 text-sm">
      <img class="w-6 h-6" :src="token?.logoURI">
      {{ formatDecimal(amount) }}
      {{ item.key }}
    </span>
    <span class="text-slate-400 text-sm">
      ({{ formatUsd(toBN(amount).times(item?.price || token?.price || 0)) }})
    </span>
  </li>
</template>
