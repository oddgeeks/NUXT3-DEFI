<script setup lang='ts'>
import { isAddress } from '@ethersproject/address'
import { useField } from 'vee-validate'
import type { IToken } from '~/stores/tokens'

const props = defineProps({
  chainId: {
    type: [String, Number],
    required: true,
  },
  address: {
    type: String,
    required: false,
  },
  contact: {
    type: Object as PropType<IContact>,
    required: false,
  },
})
defineEmits(['destroy'])

const { safeAddress } = useAvocadoSafe()

const { initialize, reset, isCrossChain, data, token, availableTokens, toAvailableNetworks, actualAddress } = useSend()

const contact = ref<IContact | undefined>(props.contact)

const {
  value: amount,
  errorMessage,
  validate,
  setValue,
} = useField<string>('amount', undefined, {
  initialValue: !isZero(data.value.amount) ? data.value.amount : undefined,
})

const {
  value: fieldAddress,
  meta: addressMeta,
  setValue: setAddress,
  validate: validateAddress,
  errorMessage: addressErrorMessage,
  errors: addressErrors,
} = useField<string>('address', undefined, {
  initialValue: data.value.address || actualAddress.value,
})

const disabled = computed(() => {
  return !actualAddress.value || addressErrors.value.length > 0
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
  data.value.tokenAddress = token.address
  validate()
}

initialize({
  fromChainId: +props.chainId,
  address: props.address,
  contact: props.contact,
})

async function handleEdit() {
  if (!props.contact)
    return

  const result = await openAddContactModal(
    props.contact.name,
    props.contact.address,
    props.contact.chainId,
    true,
  )

  if (result.success) {
    contact.value = result.payload as IContact

    data.value.address = contact.value.address
  }
}

watch(() => data.value.toChainId, () => {
  validateAddress()
})

onUnmounted(() => {
  reset()
})
</script>

<template>
  <div>
    <h1 class="text-center mb-7.5 text-lg">
      {{ isCrossChain ? 'Cross-chain Send' : 'Send' }}
      <span v-if="contact"> to {{ contact.name }}  </span>
    </h1>
    <div
      v-if="contact"
      class="flex items-center rounded-5 mb-5 -mt-3 pl-5 pr-4 py-5 dark:bg-gray-850 bg-slate-50 justify-between w-full"
    >
      <div class="flex items-center gap-3">
        <ChainLogo :stroke="false" class="w-7 h-7" :chain="contact.chainId" />
        <Copy :text="contact.address">
          <template #content>
            <span class="dark:text-white text-slate-900">{{
              shortenHash(contact.address)
            }}</span>
          </template>
        </Copy>
      </div>
      <CommonButton
        :disabled="contact.owner"
        color="white"
        class="justify-center dark:bg-slate-800 bg-slate-150 !px-4"
        @click="handleEdit()"
      >
        Edit
      </CommonButton>
    </div>

    <div class="flex flex-col gap-2.5">
      <div class="flex justify-between items-center">
        <p class="text-sm text-slate-400">
          From
        </p>
        <div class="text-xs flex gap-2 items-center">
          <ChainLogo class="w-5 h-5" :chain="data.fromChainId" />
          {{ chainIdToName(data.fromChainId) }}
        </div>
      </div>
      <div class="flex justify-between gap-5 dark:bg-gray-850 bg-slate-50 px-5 py-4 rounded-5">
        <div class="flex flex-col gap-2.5">
          <span class="text-sm">Coin</span>
          <TokenSelection
            :model-value="token"
            class="relative w-[160px] flex items-center gap-2.5 max-h-12 rounded-2xl border-2 dark:border-slate-700 border-slate-150 !bg-slate-50 dark:!bg-gray-850 px-4 py-3 text-left"
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
            :name="amount"
            class="!rounded-2xl w-full"
            input-classes="!py-3"
            autofocus
            placeholder="Enter amount"
          >
            <template #suffix>
              <span class="text-sm font-semibold text-left text-slate-400 absolute right-5">
                {{ formatUsd(toBN(token?.price || 0).times(amount || 0).toFixed()) }}</span>
            </template>
          </CommonInput>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2.5">
      <div class="flex justify-between items-center">
        <p class="text-sm text-slate-400">
          To
        </p>
      </div>
      <div class="flex justify-between gap-5 dark:bg-gray-850 bg-slate-50 px-5 py-4 rounded-5">
        <div class="flex flex-col gap-2.5">
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
            autofocus
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

    <!-- <component :is="steps[activeStep].component" @destroy="$emit('destroy')" /> -->
  </div>
</template>
