<script setup lang="ts">
import { isAddress } from '@ethersproject/address'
import { useField } from 'vee-validate'
import ContactSVG from '~/assets/images/icons/contact.svg?component'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg?component'

const { data, stepBack, stepForward, actualAddress, toAvailableNetworks } = useSend()
const { safeAddress } = useAvocadoSafe()

const { query } = useRoute()

const {
  value: address,
  meta: addressMeta,
  setValue: setAddress,
  validate,
  errorMessage,
  errors,
} = useField<string>('address', undefined, {
  initialValue: data.value.address || actualAddress.value,
})

const disabled = computed(() => {
  return !actualAddress.value || errors.value.length > 0
})

async function handleSelectContact() {
  const result = await openSelectContactModal(data.value.toChainId)

  if (result.success) {
    const _contact = result.payload as IContact

    setAddress(_contact.address)
  }
}

function handleContinue() {
  data.value.address = address.value

  stepForward()
}

watch(() => data.value.toChainId, () => {
  validate()
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

onUnmounted(() => {
  clearNuxtData('total-transfers')
})
</script>

<template>
  <div class="flex flex-col gap-5 sm:w-[360px] w-full">
    <div class="flex flex-col gap-2.5">
      <span class="text-sm">Network</span>
      <CommonSelect
        v-model="data.toChainId"
        :disabled="!query?.crossChainSend"
        value-key="chainId"
        label-key="name"
        icon-key="icon"
        class="mt-[5px]"
        :options="toAvailableNetworks"
      >
        <template #button-prefix>
          <ChainLogo class="w-6 h-6" :chain="data.toChainId" />
        </template>
        <template #item-prefix="{ value }">
          <ChainLogo class="w-6 h-6" :chain="value" />
        </template>
      </CommonSelect>
    </div>

    <div class="flex gap-2.5 flex-col">
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
          <SVGInfoCircle
            v-tippy="
              'You are sending tokens to this address for the first time, make sure to double check the address again'
            "
          /> New Address Detected
        </span>
      </div>
      <CommonInput
        v-model="address"
        autofocus
        :error-message="addressMeta.dirty ? errorMessage : ''"
        name="address"
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
            <ContactSVG />
          </button>
        </template>
      </CommonInput>
    </div>

    <div class="grid grid-cols-2 gap-5 mt-2.5">
      <CommonButton color="white" class="justify-center" size="lg" @click="stepBack">
        Back
      </CommonButton>
      <CommonButton class="justify-center" size="lg" :disabled="disabled" @click="handleContinue">
        Continue
      </CommonButton>
    </div>
  </div>
</template>
