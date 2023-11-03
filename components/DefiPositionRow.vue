<script setup lang="ts">
import { storeToRefs } from 'pinia'

const props = defineProps<{
  item: any
  borrow?: boolean
  chainId: number | string
}>()

const { tokens } = storeToRefs(useTokens())
const { fetchTokenByAddress } = useTokens()

function getTokenByKey(key: string) {
  return tokens.value.find(token => token.symbol === key)
}

const token = asyncComputed<any>(async () => {
  const token = getTokenByKey(props.item.key)
  if (token)
    return token

  const tokenAddress = props.item?.address || props.item?.underlyingTokenAddress || props.item?.aTokenAddress || props.item?.cTokenAddress

  if (!tokenAddress)
    return

  const fetchedToken = await fetchTokenByAddress([tokenAddress], String(props.chainId))

  if (fetchedToken?.length)
    return fetchedToken[0]
})

const amount = computed(() => {
  return props.borrow ? gt(props.item.borrowStable, '0') ? props.item.borrowStable : props.item.borrow : props.item.supply
})
</script>

<template>
  <li class="flex items-center justify-between border-b px-5 py-4.5 last:border-b-0 dark:border-b-gray-900">
    <span class="flex items-center gap-3 text-sm uppercase">
      <SafeTokenLogo class="h-6 w-6" :url="token?.logoURI || token?.logo_url" />
      {{ formatDecimal(amount) }}
      {{ item.key }}
    </span>
    <span class="text-sm text-gray-400">
      ({{ formatUsd(toBN(amount).times(item?.price || token?.price || 0)) }})
    </span>
  </li>
</template>
