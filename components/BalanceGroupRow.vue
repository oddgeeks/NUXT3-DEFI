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

const balances = computed(() => collapse.value ? [props.tokenBalance[0], ...props.tokenBalance] : [props.tokenBalance[0]])

function onToggle() {
  collapse.value = !collapse.value
}
</script>

<template>
  <BalanceRow
    v-for="(token, i) of balances"
    :key="`${token.chainId} - ${token.symbol}`"
    :summary="i === 0 && tokenBalance.length > 1"
    :hide="i !== 0"
    :token-balance="token"
    :sum="sum"
    :collapse="collapse"
    :sum-in-usd="sumInUsd"
    :on-toggle="onToggle"
    :count="tokenBalance.length"
  />
</template>
