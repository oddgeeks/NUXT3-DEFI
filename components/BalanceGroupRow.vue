<script lang="ts" setup>
import type { IBalance } from '~/stores/safe'

const props = defineProps<{
  tokenBalance: IBalance[]
}>()

const collapse = ref(false)

const sum = computed(() => {
  return props.tokenBalance.reduce((sum, balance) => sum + toBN(balance.balance!).toNumber(), 0)
})
const sumInUsd = computed(() => {
  return props.tokenBalance.reduce((sum, balance) => sum + toBN(balance.balanceInUSD!).toNumber(), 0)
})

function onToggle() {
  collapse.value = !collapse.value
}
</script>

<template>
  <BalanceRow
    v-for="(token, i) of (collapse ? [tokenBalance[0], ...tokenBalance] : [tokenBalance[0]])"
    :key="`${token.chainId} - ${token.symbol}`"
    :summary="i === 0"
    :hide="i !== 0"
    :token-balance="token"
    :sum="sum"
    :collapse="collapse"
    :sum-in-usd="sumInUsd"
    :on-toggle="onToggle"
  />
</template>
