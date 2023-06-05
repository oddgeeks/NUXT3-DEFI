<script setup lang="ts">
import { useField } from 'vee-validate'
import type { IToken } from '~/stores/tokens'

const { data, token, availableTokens, stepForward } = useSend()

const {
  value: amount,
  errorMessage,
  validate,
  errors,
  setValue,
} = useField<string>('amount', undefined, {
  initialValue: !isZero(data.value.amount) ? data.value.amount : undefined,
})

const disabled = computed(() => {
  return !amount.value || errors.value.length > 0
})

function handleTokenChange(token: IToken) {
  data.value.tokenAddress = token.address
  validate()
}

function handleContinue() {
  data.value.amount = amount.value

  stepForward()
}

function handleNetworkChange() {
  const firstBalancedToken = availableTokens.value.find(t => toBN(t.balance).gt('0') || !!t.balance)

  data.value.tokenAddress = firstBalancedToken?.address || ''

  data.value.toChainId = data.value.fromChainId
}

watch(() => data.value.toChainId, () => {
  validate()
})
</script>

<template>
  <div class="flex flex-col gap-5 sm:w-[360px] w-full">
    <div class="flex flex-col gap-2.5">
      <span class="text-sm">Network</span>
      <CommonSelect
        v-model="data.fromChainId"
        value-key="chainId"
        label-key="name"
        icon-key="icon"
        class="mt-[5px]"
        :options="availableNetworks"
        @update:model-value="handleNetworkChange"
      >
        <template #button-prefix>
          <ChainLogo class="w-6 h-6" :chain="data.fromChainId" />
        </template>
        <template #item-prefix="{ value }">
          <ChainLogo class="w-6 h-6" :chain="value" />
        </template>
      </CommonSelect>
    </div>
    <div class="flex flex-col gap-2.5">
      <span class="text-sm">Coin</span>
      <TokenSelection
        :model-value="token"
        class="relative w-full flex items-center gap-2.5 max-h-12 rounded-2xl border-2 dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 px-4 py-3 text-left"
        :tokens="availableTokens"
        @update:model-value="handleTokenChange"
      />
    </div>
    <div class="gap-y-2.5 flex flex-col flex-1">
      <div class="flex items-center justify-between">
        <span class="text-sm">Amount</span>
        <div class="flex text-sm uppercase gap-x-3">
          <span>
            {{ formatDecimal(token?.balance || '0') }}
            {{ token?.symbol }}
          </span>
          <button
            type="button"
            class="text-primary hover:text-primary"
            @click="setValue(token?.balance || '0')"
          >
            MAX
          </button>
        </div>
      </div>
      <CommonInput
        v-model="amount"
        type="numeric"
        :error-message="errorMessage"
        :name="amount"
        autofocus
        placeholder="Enter amount"
      >
        <template #suffix>
          <span class="text-sm font-semibold text-left text-slate-400">
            {{ formatUsd(toBN(token?.price || 0).times(amount || 0).toFixed()) }}</span>
        </template>
      </CommonInput>
    </div>
    <CommonButton :disabled="disabled" class="justify-center" size="lg" @click="handleContinue">
      Continue
    </CommonButton>
  </div>
</template>
