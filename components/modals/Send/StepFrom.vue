<script setup lang="ts">
import { isAddress } from '@ethersproject/address'
import { useField } from 'vee-validate'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import CheckCircle from '~/assets/images/icons/check-circle.svg?component'
import type { IToken } from '~/stores/tokens'

defineEmits(['destroy'])

const { safeAddress } = useAvocadoSafe()
const { isSafeMultisig } = storeToRefs(useMultisig())

const { authorisedNetworks } = useAuthorities()

const { isCrossChain, data, token, availableTokens, actualAddress, stepForward, tokenlistPending } = useSend()

const { isInputUsd } = useInputUsd()
const [dirty, toggleDirty] = useToggle(false)
const [max, toggleMax] = useToggle(false)

const toCrossChainNetworks = computed(() => authorisedNetworks.value.filter(network => network.chainId !== data.value.fromChainId))
const fromNetwork = computed(() => chainIdToName(data.value.fromChainId))
const targetNetwork = computed(() => chainIdToName(data.value.toChainId))

const breakPoints = useBreakpoints(breakpointsTailwind)
const isMobile = computed(() => breakPoints.smaller('sm').value)

const amountPlaceholder = computed(() => isMobile.value ? 'Enter' : 'Enter amount')

const {
  value: amount,
  errorMessage,
  validate,
  setValue,
  setErrors,
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

const amountInUsd = computed({
  get() {
    return toBN(token?.value?.price || 0)
      .times(amount.value || 0)
      .decimalPlaces(4, 6).toNumber()
  },
  set(newValue) {
    if (max.value)
      return

    const value = toBN(newValue || 0).div(token.value?.price || 0)

    setValue(toBN(value)
      .decimalPlaces(4, 6)
      .toString(), true)
  },
})

const disabled = computed(() => {
  return !actualAddress.value || !!errors.value.length || !!addressErrors.value.length || !amount.value || tokenlistPending.value
})

const isCrossChainEnable = computed(() => {
  return toCrossChainNetworks.value?.length > 1 && !isSafeMultisig.value && !bridgeDisabledChains.includes(data.value.fromChainId)
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

function onToggleCrossChain() {
  if (!isCrossChain.value && toCrossChainNetworks.value.length > 0)
    data.value.toChainId = toCrossChainNetworks.value[0].chainId

  else
    data.value.toChainId = data.value.fromChainId
}

function handleSetMax() {
  setErrors('')
  toggleDirty()
  toggleMax(true)

  setValue(token.value?.balance || '0', true)
}

onMounted(() => {
  validate()
})
</script>

<template>
  <div class="flex w-full flex-col gap-5 sm:gap-[26px] md:w-[450px]">
    <div
      class="mx-auto flex w-full items-center justify-between gap-2 rounded-full"
    >
      <p class="rounded-full border border-[#1e293b] px-5 py-1 text-xs">
        <span class="hidden sm:inline"> Processing on the</span> <ChainLogo class="inline h-6 w-6" :chain="data.fromChainId" />
        {{ chainIdToName(data.fromChainId) }}
      </p>
      <CommonToggle v-model="isInputUsd" text="Input USD" />
    </div>
    <div class="flex flex-col gap-2.5 font-medium">
      <div class="flex justify-between gap-2.5 sm:gap-5">
        <div class="flex flex-col gap-2.5">
          <span class="text-sm font-medium">Token</span>
          <TokenSelection
            :model-value="token"
            :chain-id="data.fromChainId"
            network-logo-class="w-[15px] h-[15px]"
            class="relative flex w-[160px] items-center gap-2.5 text-left"
            :tokens="availableTokens"
            @update:model-value="handleTokenChange"
          />
        </div>

        <div class="flex flex-1 flex-col gap-2.5">
          <div class="flex items-center justify-between whitespace-nowrap">
            <span class="text-sm">Amount</span>
            <div class="flex gap-x-3 text-sm uppercase">
              <span>
                {{ formatDecimal(token?.balance || '0') }}
                {{ token?.symbol }}
              </span>
              <button
                type="button"
                class="text-primary hover:text-primary"
                @click="handleSetMax"
              >
                MAX
              </button>
            </div>
          </div>

          <CommonCurrencyInput
            v-if="isInputUsd"
            v-model="amountInUsd"
            :dirty="dirty"
            styled
            input-classes="!py-3"
            autofocus
            :error-message="errorMessage"
            name="amount-usd"
            :placeholder="amountPlaceholder"
            @beforeinput="toggleMax(false)"
          >
            <template #suffix>
              <span class="absolute right-5 text-left text-sm text-gray-400">
                {{ formatDecimal(amount) }}
              </span>
            </template>
          </CommonCurrencyInput>

          <CommonInput
            v-else
            v-model="amount"
            type="numeric"
            :error-message="errorMessage"
            name="amount"
            autofocus
            class="w-full !rounded-2xl"
            input-classes="!py-3"
            :placeholder="amountPlaceholder"
            @beforeinput="toggleMax(false)"
          >
            <template #suffix>
              <span class="absolute right-5 text-left text-sm text-gray-400">
                {{ formatUsd(amountInUsd) }}
              </span>
            </template>
          </CommonInput>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2.5 font-medium">
      <div class="flex justify-between gap-2.5 sm:gap-5">
        <div
          v-if="isCrossChain"
          class="flex flex-col gap-2.5"
        >
          <span class="text-sm">Network</span>
          <CommonSelect
            v-model="data.toChainId"
            value-key="chainId"
            label-key="name"
            icon-key="icon"
            class="w-[160px]"
            :options="toCrossChainNetworks"
          >
            <template #button-prefix>
              <ChainLogo class="h-6 w-6 shrink-0" :chain="data.toChainId" />
            </template>
            <template #item-prefix="{ value }">
              <ChainLogo class="h-6 w-6 shrink-0" :chain="value" />
            </template>
          </CommonSelect>
        </div>

        <div class="flex w-full flex-col gap-2.5">
          <div class="flex items-center justify-between whitespace-nowrap">
            <span class="text-sm">Address</span>
            <span v-if="totalTransfers" class="text-sm text-gray-400">
              {{ totalTransfers }} previous
              {{ totalTransfers === 1 ? "send" : "sends" }}
            </span>
            <span
              v-else-if="totalTransfers === 0"
              class="flex items-center gap-2 text-sm text-orange-400"
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
            class="w-full !rounded-2xl"
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

    <div class="flex items-center text-xs font-medium leading-6 text-gray-400">
      <SvgoInfo2
        class="svg-gray-info mr-2.5 h-4 w-4 rounded-full"
      />
      <div v-if="isCrossChain" class="flex items-center">
        Sending&nbsp;{{ token?.symbol.toUpperCase() }}&nbsp;from&nbsp;<ChainLogo class="h-4 w-4 shrink-0" :chain="data.fromChainId" />&nbsp;{{ fromNetwork }}&nbsp;to Receiver on&nbsp;<ChainLogo class="h-4 w-4 shrink-0" :chain="data.toChainId" />&nbsp;{{ targetNetwork }}
      </div>
      <div v-else class="flex items-center">
        Sending&nbsp;{{ token?.symbol.toUpperCase() }}&nbsp;on&nbsp;<ChainLogo class="h-4 w-4 shrink-0" :chain="data.fromChainId" />&nbsp;{{ fromNetwork }}
      </div>
    </div>
    <div v-if="isCrossChainEnable" class="flex items-center gap-2.5">
      <button
        :class="{
          'text-white': isCrossChain,
        }"
        class="flex items-center gap-2.5 text-sm text-gray-400"
        @click="onToggleCrossChain"
      >
        <CheckCircle
          :class="[
            { 'success-circle text-white': isCrossChain },
            { 'svg-circle darker': !isCrossChain },
          ]"
          class="h-4 w-4"
        />
        I want to send cross-chain
      </button>
      <SvgoQuestionCircle
        v-tippy="'Cross-chain send allows you to directly send tokens from chain A to the receiver on chain B'"
        class="h-4 w-4 text-gray-400"
      />
    </div>
  </div>

  <CommonButton :loading="tokenlistPending" :disabled="disabled" class="mt-7.5 w-full justify-center" size="lg" @click="handleContinue">
    Continue
  </CommonButton>
</template>
