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
    return toBN(token?.value?.price || 0).times(amount.value || 0).toNumber()
  },
  set(newValue) {
    const value = toBN(newValue || 0).div(token.value?.price || 0)

    setValue(toBN(value)
      .decimalPlaces(6, 1)
      .toString(), true)
  },
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

function onToggleCrossChain() {
  if (!isCrossChain.value && toCrossChainNetworks.value.length > 0)
    data.value.toChainId = toCrossChainNetworks.value[0].chainId

  else
    data.value.toChainId = data.value.fromChainId
}

function handleSetMax() {
  setErrors('')
  toggleMax(true)

  setValue(token.value?.balance || '0', false)
}

onMounted(() => {
  validate()
})
</script>

<template>
  <div class="flex flex-col gap-[26px] w-full md:w-[450px]">
    <div
      class="flex gap-2 justify-between items-center w-full mx-auto rounded-full"
    >
      <p class="text-xs py-1 px-5 rounded-full border border-[#1e293b]">
        <span class="sm:inline hidden"> Processing on the</span> <ChainLogo class="w-6 h-6 inline" :chain="data.fromChainId" />
        {{ chainIdToName(data.fromChainId) }}
      </p>
      <CommonToggle v-model="isInputUsd" text="Input USD" />
    </div>
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
                @click="handleSetMax"
              >
                MAX
              </button>
            </div>
          </div>

          <CommonCurrencyInput
            v-if="isInputUsd"
            v-model="amountInUsd"
            :dirty="max"
            styled
            input-classes="!py-3"
            autofocus
            :error-message="errorMessage"
            name="amount-usd"
            :placeholder="amountPlaceholder"
          >
            <template #suffix>
              <span class="text-sm text-left text-slate-400 absolute right-5">
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
            class="!rounded-2xl w-full"
            input-classes="!py-3"
            :placeholder="amountPlaceholder"
          >
            <template #suffix>
              <span class="text-sm text-left text-slate-400 absolute right-5">
                {{ formatUsd(amountInUsd) }}
              </span>
            </template>
          </CommonInput>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2.5 font-medium">
      <div class="flex justify-between gap-5">
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
      <div class="text-slate-400 font-medium leading-6 flex items-center text-xs">
        <SvgoInfo2
          class="mr-2.5 h-4 w-4 svg-gray-info rounded-full"
        />
        <div v-if="isCrossChain" class="flex items-center">
          Sending&nbsp;{{ token?.symbol.toUpperCase() }}&nbsp;from&nbsp;<ChainLogo class="w-4 h-4 shrink-0" :chain="data.fromChainId" />&nbsp;{{ fromNetwork }}&nbsp;to Receiver on&nbsp;<ChainLogo class="w-4 h-4 shrink-0" :chain="data.toChainId" />&nbsp;{{ targetNetwork }}
        </div>
        <div v-else class="flex items-center">
          Sending&nbsp;{{ token?.symbol.toUpperCase() }}&nbsp;on&nbsp;<ChainLogo class="w-4 h-4 shrink-0" :chain="data.fromChainId" />&nbsp;{{ fromNetwork }}
        </div>
      </div>
    </Transition>
    <div v-if="toCrossChainNetworks?.length > 1 && !isSafeMultisig" class="flex gap-2.5 items-center">
      <button
        :class="{
          'dark:text-white text-slate-900': isCrossChain,
        }"
        class="text-sm text-slate-400 flex gap-2.5 items-center"
        @click="onToggleCrossChain"
      >
        <CheckCircle
          :class="[
            { 'success-circle text-white': isCrossChain },
            { 'svg-circle darker': !isCrossChain },
          ]"
          class="w-4 h-4"
        />
        I want to send cross-chain
      </button>
      <SvgoQuestionCircle
        v-tippy="'Cross-chain send allows you to directly send tokens from chain A to the receiver on chain B'"
        class="text-slate-400 w-4 h-4"
      />
    </div>
  </div>

  <CommonButton :loading="tokenlistPending" :disabled="disabled" class="justify-center mt-7.5 w-full" size="lg" @click="handleContinue">
    Continue
  </CommonButton>
</template>
