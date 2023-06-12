<script setup lang="ts">
import { isAddress } from '@ethersproject/address'
import { useField } from 'vee-validate'
import type { IToken } from '~/stores/tokens'

defineEmits(['destroy'])

const { safeAddress } = useAvocadoSafe()

const { isCrossChain, data, token, availableTokens, toAvailableNetworks, actualAddress, stepForward, tokenlistPending } = useSend()

const {
  value: amount,
  errorMessage,
  validate,
  setValue,
  errors,
} = useField<string>('amount', undefined, {
  initialValue: !isZero(data.value.amount) ? data.value.amount : undefined,
})

const {
  value: fieldAddress,
  meta: addressMeta,
  setValue: setAddress,
  errorMessage: addressErrorMessage,
  errors: addressErrors,
} = useField<string>('address', undefined, {
  initialValue: data.value.address || actualAddress.value,
})

const disabled = computed(() => {
  return !actualAddress.value || !!errors.value.length || !!addressErrors.value.length || !amount.value || tokenlistPending.value
})

const { data: totalTransfers } = useAsyncData(
  'total-transfers',
  async () => {
    if (!isAddress(actualAddress.value))
      return

    const res = await http('/api/transfers', {
      params: {
        from: safeAddress.value,
        to: [actualAddress.value],
        chainIds: [data.value.toChainId],
      },
    })

    return res[0]?.transferCount || 0
  },
  {
    watch: [actualAddress, () => data.value.toChainId],
  },
)

async function handleSelectContact() {
  const result = await openSelectContactModal(data.value.toChainId)

  if (result.success) {
    const _contact = result.payload as IContact

    setAddress(_contact.address)
  }
}

function handleTokenChange(token: IToken) {
  data.value.fromChainId = Number(token.chainId)
  data.value.toChainId = Number(token.chainId)
  data.value.tokenAddress = token.address

  validate()
}

function handleContinue() {
  data.value.amount = amount.value
  stepForward()
}
</script>

<template>
  <div class="flex flex-col gap-[26px]">
    <div class="flex flex-col gap-2.5 font-medium">
      <div class="flex justify-between gap-5">
        <div class="flex flex-col gap-2.5">
          <span class="text-sm font-medium">Token</span>
          <TokenSelection
            :model-value="token"
            :chain-id="data.fromChainId"
            network-logo-class="w-[15px] h-[15px]"
            class="relative w-[160px] flex items-center gap-2.5 max-h-12 rounded-[14px] border-1 dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 text-left"
            :tokens="availableTokens"
            @update:model-value="handleTokenChange"
          />
        </div>

        <div class="flex flex-col gap-2.5 flex-1">
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
            name="amount"
            autofocus
            class="!rounded-2xl w-full"
            input-classes="!py-3"
            placeholder="Enter amount"
          >
            <template #suffix>
              <span class="text-sm text-left text-slate-400 absolute right-5">
                {{ formatUsd(toBN(token?.price || 0).times(amount || 0).toFixed()) }}</span>
            </template>
          </CommonInput>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2.5 font-medium">
      <div class="flex justify-between gap-5">
        <div
          class="flex flex-col gap-2.5"
        >
          <span class="text-sm">Network</span>
          <CommonSelect
            v-model="data.toChainId"
            value-key="chainId"
            label-key="name"
            icon-key="icon"
            class="w-[160px]"
            :options="toAvailableNetworks"
          >
            <template #button-prefix>
              <ChainLogo class="w-6 h-6 shrink-0" :chain="data.toChainId" />
            </template>
            <template #item-prefix="{ value }">
              <ChainLogo class="w-6 h-6 shrink-0" :chain="value" />
            </template>
          </CommonSelect>
        </div>

        <div class="flex gap-2.5 flex-col w-full">
          <div class="flex items-center justify-between">
            <span class="text-sm">Address</span>
            <span v-if="totalTransfers" class="text-sm text-slate-400">
              {{ totalTransfers }} previous
              {{ totalTransfers === 1 ? "send" : "sends" }}
            </span>
            <span
              v-else-if="totalTransfers === 0"
              class="text-sm text-orange-400 flex items-center gap-2"
            >
              <SvgoExclamationCircle
                v-tippy="
                  'You are sending tokens to this address for the first time, make sure to double check the address again'
                "
              /> New Address Detected
            </span>
          </div>
          <CommonInput
            v-model="fieldAddress"
            :error-message="addressMeta.dirty ? addressErrorMessage : ''"
            name="address"
            class="!rounded-2xl w-full"
            input-classes="!py-3"
            placeholder="Enter Address"
          >
            <template #suffix>
              <button
                v-tippy="{
                  content: 'Select contact',
                }"
                type="button"
                class="ml-3"
                @click="handleSelectContact()"
              >
                <SvgoContact />
              </button>
            </template>
          </CommonInput>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <p v-if="isCrossChain" class="text-slate-400 font-medium leading-6 flex items-center text-xs">
        <SvgoExclamationCircle class="mr-2.5 h-4.5 w-4.5 text-slate-500" />
        This is a cross-chain send
      </p>
    </Transition>
  </div>

  <CommonButton :loading="tokenlistPending" :disabled="disabled" class="justify-center mt-7.5 w-full" size="lg" @click="handleContinue">
    Continue
  </CommonButton>
</template>
